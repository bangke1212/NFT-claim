import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CHAINS } from "@/lib/chains";
import { NFT_ABI } from "@/lib/abi";
import { loadTargets, saveTargets, type Target } from "@/lib/storage";
import {
  disconnectWallet,
  doSwitchChain,
  autoConnectMetaMask,
  connectMetaMask,
  hasMetaMask,
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

  // ====== AUTO-CONNECT ON MOUNT ======
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
          setAutoConnecting(false);
          return;
        }
      } catch { /* silent */ }

      const fromMM = new URLSearchParams(window.location.search).has("mm_connect");
      if (fromMM && hasMetaMask() && !cancelled) {
        try {
          const ws = await connectMetaMask();
          if (cancelled) return;
          if (ws) {
            setWalletState(ws);
            setWalletType("metamask");
            setAddr(ws.address);
            setCid(ws.chainId);
            setBal(ws.balance);
            notify("Connected to MetaMask Mobile!", "success");
            const clean = window.location.href.replace(/[?&]mm_connect=1/, "").replace(/\?$/, "");
            window.history.replaceState({}, "", clean);
          }
        } catch { /* user reject — biarkan manual */ }
      }

      if (!cancelled) setAutoConnecting(false);
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
      notify("Switch failed: " + (e?.shortMessage || e?.message || "").slice(0, 60), "error");
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

  // ====== CLAIM / MINT — with ETH value for paid mints ======
  const runClaim = async (t: Target) => {
    if (!addr || !ethers.isAddress(t.contract)) {
      notify("Connect wallet & enter valid contract", "error");
      return;
    }
    const tc = CHAINS[t.chain];
    if (tc && cid !== tc.id) {
      try {
        await switchChain(t.chain);
      } catch {
        notify("Failed to switch chain — switch manually in MetaMask", "error");
        return;
      }
    }
    setBusy("c:" + t.id);
    updateTarget(t.id, { status: "monitoring" });

    try {
      const s = await walletState!.provider.getSigner();
      const ctr = new ethers.Contract(t.contract, NFT_ABI, s);

      // === Auto-approve (optional) ===
      if (t.autoApprove) {
        try {
          if (!(await ctr.isApprovedForAll(addr, t.contract))) {
            const txA = await ctr.setApprovalForAll(t.contract, true);
            await txA.wait();
          }
        } catch { /* optional — some contracts don't need it */ }
      }

      // === Probe price for paid mints ===
      let price = 0n;
      try { price = await ctr.price(); } catch {}
      if (price === 0n) try { price = await ctr.mintPrice(); } catch {}
      if (price === 0n) try { price = await ctr.cost(); } catch {}

      const value = price * BigInt(t.amount);
      const method = t.method || "claim";

      // === Try multiple method signatures ===
      // With value (paid mint) then without (free mint fallback)
      let tx: ethers.ContractTransaction | null = null;
      let lastErr: any = null;

      // Build attempts based on method type
      const needsProof = ["mintListed","whitelistMint","presaleMint"].includes(method);
      const isSimplePayable = ["purchase","buy","buyMint","publicSaleMint"].includes(method);
      const emptyProof: string[] = []; // bytes32[] kosong — beberapa contract terima ini
      
      const attempts: Array<() => Promise<ethers.ContractTransaction>> = [];
      
      if (needsProof) {
        // Method butuh merkle proof — coba dengan proof kosong
        const method3arg = ['mintListed','presaleMint'].includes(method);
        attempts.push(
          method3arg
            ? () => ctr[method](t.amount, emptyProof, 5, { value })
            : () => ctr[method](t.amount, emptyProof, { value }),
          method3arg
            ? () => ctr[method](t.amount, emptyProof, 5)  // free fallback
            : () => ctr[method](t.amount, emptyProof),
        );
      } else if (isSimplePayable) {
        // Method payable 1 arg
        attempts.push(
          () => ctr[method](t.amount, { value }),
          () => ctr[method](t.amount), // free fallback
        );
      }
      
      // Always try standard signatures
      attempts.push(
        () => ctr[method](t.amount, { value }),
        () => ctr[method](addr, t.amount, { value }),
        () => ctr[method]({ value }),
        () => ctr[method](addr, { value }),
      );

      // Free mint fallbacks
      if (value > 0n || needsProof) {
        attempts.push(
          () => ctr[method](t.amount),
          () => ctr[method](addr, t.amount),
          () => ctr[method](),
          () => ctr[method](addr),
        );
      }

      for (const att of attempts) {
        try {
          tx = await att();
          break;
        } catch (e) {
          lastErr = e;
          // Continue to next signature
        }
      }

      if (!tx) throw lastErr || new Error("No matching method signature found");

      // === Wait for confirmation ===
      const txMsg = value > 0n
        ? `TX: ${tx.hash.slice(0, 10)}... · ${ethers.formatEther(value)} ETH`
        : `TX: ${tx.hash.slice(0, 10)}...`;

      notify(txMsg);
      const rec = await tx.wait();

      if (!rec || rec.status === 0) {
        throw new Error("Transaction reverted on-chain");
      }

      updateTarget(t.id, { status: "claimed" });
      notify(`✅ CLAIM SUCCESS! Block #${rec.blockNumber}`, "success");

      // Refresh balance
      const p = walletState!.provider;
      setBal(ethers.formatEther(await p.getBalance(addr)));

    } catch (e: any) {
      updateTarget(t.id, { status: "failed" });

      // === Categorize errors for better UX ===
      const msg: string = e?.shortMessage || e?.reason || e?.message || "Unknown error";
      let friendly = msg;

      if (msg.includes("insufficient funds")) {
        friendly = "💰 Insufficient ETH balance for mint";
      } else if (msg.includes("reverted")) {
        if (msg.includes("paused") || msg.includes("Paused")) {
          friendly = "⏸ Sale is paused";
        } else if (msg.includes("sold out") || msg.includes("max supply") || msg.includes("exceed")) {
          friendly = "📦 Sold out / max supply reached";
        } else if (msg.includes("whitelist") || msg.includes("not eligible") || msg.includes("allowlist")) {
          friendly = "🔒 Not on whitelist/allowlist";
        } else if (msg.includes("payment") || msg.includes("price") || msg.includes("value")) {
          friendly = "💳 Incorrect payment amount";
        } else if (msg.includes("not active") || msg.includes("sale")) {
          friendly = "⏸ Sale not active yet";
        } else {
          friendly = `❌ Contract reverted: ${msg.slice(0, 60)}`;
        }
      } else if (msg.includes("user rejected") || msg.includes("denied")) {
        friendly = "✋ Transaction cancelled";
      }

      notify(friendly, "error");
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
