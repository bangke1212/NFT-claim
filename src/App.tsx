import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CHAINS } from "@/lib/chains";
import { NFT_ABI } from "@/lib/abi";
import { loadTargets, saveTargets, type Target } from "@/lib/storage";
import {
  disconnectWallet,
  doSwitchChain,
  autoConnectMetaMask,
  type WalletState,
  type WalletType,
} from "@/lib/wallet";
import Header from "@/components/Header";
import Toast from "@/components/Toast";
import WalletModal from "@/components/WalletModal";
import AddTargetModal from "@/components/AddTargetModal";
import Overview from "@/components/Overview";
import Targets from "@/components/Targets";
import Claim from "@/components/Claim";
import Guide from "@/components/Guide";

declare global { interface Window { ethereum?: any } }

export default function App() {
  const [addr, setAddr] = useState("");
  const [cid, setCid] = useState(0);
  const [bal, setBal] = useState("0");
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [targets, setTargets] = useState<Target[]>([]);
  const [walletType, setWalletType] = useState<WalletType>("none");
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [showWalletSelect, setShowWalletSelect] = useState(false);
  const [showAddTarget, setShowAddTarget] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(true);

  useEffect(() => { setTargets(loadTargets()); }, []);
  const notify = useCallback((m: string, t = "info") => { setToast({ m, t }); setTimeout(() => setToast(null), 3500); }, []);
  const copy = (x: string) => { navigator.clipboard?.writeText(x); notify("Copied!"); };

  // ====== AUTO-CONNECT METAMASK ON MOUNT ======
  useEffect(() => {
    let cancelled = false;
    async function tryAutoConnect() {
      try {
        const ws = await autoConnectMetaMask();
        if (cancelled) return;
        if (ws) {
          setWalletState(ws);
          setWalletType("metamask");
          setAddr(ws.address);
          setCid(ws.chainId);
          setBal(ws.balance);
        }
      } catch {
        // silent — user belum authorize
      } finally {
        if (!cancelled) setAutoConnecting(false);
      }
    }
    tryAutoConnect();
    return () => { cancelled = true; };
  }, []);

  // ====== METAMASK EVENT LISTENERS ======
  useEffect(() => {
    if (!window.ethereum || walletType !== "metamask") return;

    const handleAccountsChanged = async (...args: any[]) => {
      const raw = args[0];
      const accounts: string[] = Array.isArray(raw) ? raw : raw?.accounts ?? [];
      if (!accounts.length) {
        disconnect();
      } else if (walletState) {
        try {
          const p = walletState.provider;
          const bal = await p.getBalance(accounts[0]);
          setAddr(accounts[0]);
          setBal(ethers.formatEther(bal));
        } catch { /* ignore */ }
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setCid(newChainId);
      if (walletState) {
        try {
          const bal = await walletState.provider.getBalance(walletState.address);
          setBal(ethers.formatEther(bal));
        } catch { /* ignore */ }
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [walletType, walletState]);

  const onWalletConnect = (ws: WalletState, type: WalletType) => {
    setWalletState(ws);
    setWalletType(type);
    setAddr(ws.address);
    setCid(ws.chainId);
    setBal(ws.balance);
    notify("Connected to MetaMask!", "success");
  };

  const disconnect = async () => {
    await disconnectWallet();
    setAddr("");
    setCid(0);
    setBal("0");
    setWalletType("none");
    setWalletState(null);
    notify("Disconnected");
  };

  const switchChain = async (k: string) => {
    const c = CHAINS[k];
    if (!c || !walletState) return;
    try {
      await doSwitchChain(walletState.provider, c.id, c.name, c.rpc, c.explorer, c.symbol);
      setCid(c.id);
      notify("Switched to " + c.name, "success");
    } catch (e: any) {
      notify("Switch failed", "error");
    }
  };

  const addTarget = (t: Target) => {
    const next = [t, ...targets];
    setTargets(next);
    saveTargets(next);
  };

  const deleteTarget = (id: string) => {
    const next = targets.filter(t => t.id !== id);
    setTargets(next);
    saveTargets(next);
  };

  const updateTarget = (id: string, p: Partial<Target>) => {
    const next = targets.map(t => t.id === id ? { ...t, ...p } : t);
    setTargets(next);
    saveTargets(next);
  };

  const runClaim = async (t: Target) => {
    if (!addr || !ethers.isAddress(t.contract)) {
      notify("Connect wallet & enter valid contract", "error");
      return;
    }
    const tc = CHAINS[t.chain];
    if (tc && cid !== tc.id) {
      await switchChain(t.chain);
    }
    setBusy("c:" + t.id);
    updateTarget(t.id, { status: "monitoring" });
    try {
      const s = await walletState!.provider.getSigner();
      const ctr = new ethers.Contract(t.contract, NFT_ABI, s);
      if (t.autoApprove) {
        try {
          if (!(await ctr.isApprovedForAll(addr, t.contract))) {
            const txA = await ctr.setApprovalForAll(t.contract, true);
            await txA.wait();
          }
        } catch { /* optional */ }
      }
      const method = t.method || "claim";
      let tx: any = null;
      let le: any = null;
      for (const att of [
        () => ctr[method](t.amount),
        () => ctr[method](addr, t.amount),
        () => ctr[method](),
        () => ctr[method](addr),
      ]) {
        try { tx = await att(); break; } catch (e) { le = e; }
      }
      if (!tx) throw le || new Error("No matching method");
      notify("TX: " + tx.hash.slice(0, 10) + "...");
      const rec = await tx.wait();
      updateTarget(t.id, { status: "claimed" });
      notify("CLAIM SUCCESS! Block #" + rec.blockNumber, "success");
      const p = walletState!.provider;
      setBal(ethers.formatEther(await p.getBalance(addr)));
    } catch (e: any) {
      updateTarget(t.id, { status: "failed" });
      notify("Failed: " + (e?.shortMessage || e?.reason || e?.message || "Unknown").slice(0, 80), "error");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Header
        addr={addr} bal={bal} cid={cid} walletType={walletType} tab={tab}
        onTab={setTab} onConnect={() => setShowWalletSelect(true)} onDisconnect={disconnect}
        connecting={autoConnecting}
      />

      <Toast toast={toast} />

      <WalletModal
        show={showWalletSelect}
        onClose={() => setShowWalletSelect(false)}
        onConnect={onWalletConnect}
        notify={notify}
        chainId={cid}
      />

      <AddTargetModal
        show={showAddTarget}
        onClose={() => setShowAddTarget(false)}
        onAdd={addTarget}
        notify={notify}
      />

      <main className="max-w-7xl mx-auto px-6 py-6 sm:py-8">
        <div key={tab} className="animate-fadeIn">
          {tab === "overview" && (
            <Overview
              targets={targets} addr={addr} bal={bal} cid={cid}
              onAdd={() => setShowAddTarget(true)} onCopy={copy} onSwitchChain={switchChain}
            />
          )}
          {tab === "targets" && (
            <Targets
              targets={targets} addr={addr} busy={busy}
              onAdd={() => setShowAddTarget(true)} onClaim={runClaim}
              onDelete={deleteTarget} onUpdate={updateTarget} onCopy={copy}
            />
          )}
          {tab === "claim" && (
            <Claim addr={addr} onSwitchChain={switchChain} onClaim={runClaim} busy={busy} notify={notify} />
          )}
          {tab === "guide" && <Guide />}
        </div>
      </main>
    </div>
  );
}
