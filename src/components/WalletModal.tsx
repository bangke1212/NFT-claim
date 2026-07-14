import { useState } from "react";
import { isMobile, MOBILE_WALLETS, connectMetaMask, connectWalletConnectDesktop, generateWCUri, resumeWCSession, type WalletState, type WalletType } from "@/lib/wallet";
import { Wallet, XCircle, ChevronRight, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onConnect: (ws: WalletState, type: WalletType) => void;
  notify: (m: string, t?: string) => void;
  chainId: number;
}

export default function WalletModal({ show, onClose, onConnect, notify, chainId }: Props) {
  const [connecting, setConnecting] = useState(false);
  const [showMobileWallets, setShowMobileWallets] = useState(false);
  const [wcUri, setWcUri] = useState("");
  const mobile = isMobile();

  if (!show) return null;

  const connectMeta = async () => {
    setConnecting(true);
    try {
      const ws = await connectMetaMask();
      onConnect(ws, "metamask");
      onClose();
    } catch (e: any) {
      notify(e?.message || "MetaMask connect failed", "error");
    }
    setConnecting(false);
  };

  const connectWC = async () => {
    setConnecting(true);
    try {
      if (mobile) {
        const uri = await generateWCUri(chainId || 1);
        setWcUri(uri);
        setShowMobileWallets(true);
        // Listen for return from wallet app
        const handler = async () => {
          document.removeEventListener("visibilitychange", handler);
          window.removeEventListener("focus", handler);
          setTimeout(async () => {
            try {
              const ws = await resumeWCSession();
              if (ws) { onConnect(ws, "walletconnect"); onClose(); }
              setShowMobileWallets(false);
            } catch {}
          }, 1500);
        };
        document.addEventListener("visibilitychange", handler);
        window.addEventListener("focus", handler);
      } else {
        const ws = await connectWalletConnectDesktop(chainId || 1);
        onConnect(ws, "walletconnect");
        onClose();
      }
    } catch (e: any) {
      notify(e?.message || "WalletConnect failed", "error");
    }
    setConnecting(false);
  };

  const openMobileWallet = (walletKey: string) => {
    const w = MOBILE_WALLETS.find(x => x.key === walletKey);
    if (w) window.location.href = w.deepLink(wcUri);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      {!showMobileWallets ? (
        <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Wallet size={14} className="text-[#B8A9E8]"/> Connect Wallet
            </h3>
            <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><XCircle size={16}/></button>
          </div>
          <div className="p-5 space-y-3">
            {!mobile && (
              <button onClick={connectMeta} disabled={connecting} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] transition-colors text-left group disabled:opacity-50">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F5A623]/15">
                  <svg width="18" height="18" viewBox="0 0 32 32"><path d="M29.7 6L17.7 14.8l2.2-5.1z" fill="#E2761B"/><path d="M3.3 6l11.8 8.8-2.1-5.1z" fill="#E4761B"/><path d="M25.6 20.8l-3.2 4.9 6.9 1.9 2-6.8z" fill="#E4761B"/><path d="M.7 20.8l2 6.8 6.9-1.9-3.2-4.9z" fill="#E4761B"/></svg>
                </div>
                <div><p className="text-sm font-semibold">Browser Extension</p><p className="text-[11px] text-[#6B6B6B]">MetaMask · Rabby</p></div>
                {connecting ? <Loader2 size={14} className="ml-auto animate-spin"/> : <ChevronRight size={14} className="ml-auto text-[#E0E0E0]"/>}
              </button>
            )}
            <button onClick={connectWC} disabled={connecting} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#4ECDC4]/30 bg-[#4ECDC4]/5 hover:bg-[#4ECDC4]/10 transition-colors text-left group disabled:opacity-50">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#4ECDC4]/20">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="#115E59"><path d="M10.5 12.3c3-2.8 7.8-2.8 10.8 0l.4.3c.1.1.2.3 0 .4l-1.2 1.2c-.1.1-.2.1-.3 0l-.5-.5c-2.3-2.1-6.1-2.1-8.4 0zm13.3 2.5l1.1 1c.1.1.1.3 0 .4l-5 4.7c-.1.1-.3.1-.4 0l-3.5-3.3-3.5 3.3c-.1.1-.3.1-.4 0l-5-4.7c-.1-.1-.1-.3 0-.4l1.1-1c.1-.1.3-.1.4 0l3.5 3.3 3.5-3.3c.3-.2.6-.2.9 0l3.5 3.3 3.5-3.3c.1-.1.3-.1.4 0z"/></svg>
              </div>
              <div><p className="text-sm font-semibold">{mobile ? "📱 Mobile Wallet" : "WalletConnect"}</p><p className="text-[11px] text-[#6B6B6B]">{mobile ? "Tap — auto opens wallet app" : "Scan QR with phone"}</p></div>
              {connecting ? <Loader2 size={14} className="ml-auto animate-spin"/> : <ChevronRight size={14} className="ml-auto text-[#E0E0E0]"/>}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
          <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">📱 Open Wallet App</h3>
            <button onClick={() => { setShowMobileWallets(false); onClose(); }} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><XCircle size={16}/></button>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-xs text-[#6B6B6B]">Choose wallet app to connect:</p>
            {MOBILE_WALLETS.map((w) => (
              <button key={w.key} onClick={() => openMobileWallet(w.key)} className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] active:bg-[#F0F0F0] transition-colors text-left" style={{ borderLeftWidth: "3px", borderLeftColor: w.color }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: w.color + "20" }}>{w.key === "metamask" ? "🦊" : w.key === "trust" ? "🛡️" : w.key === "rainbow" ? "🌈" : "🔐"}</div>
                <div className="flex-1"><p className="text-sm font-semibold">{w.name}</p><p className="text-[11px] text-[#6B6B6B]">Tap → approve → return here</p></div>
                <ExternalLink size={14} className="text-[#9B9B9B]"/>
              </button>
            ))}
            <div className="pt-2 border-t border-[#F0F0F0]">
              <p className="text-[10px] text-[#9B9B9B] mb-2">Other wallet? Copy link:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] font-mono text-[#6B6B6B] bg-[#F0F0F0] px-3 py-2 rounded-lg truncate">{wcUri.slice(0, 50)}...</code>
                <button onClick={() => { navigator.clipboard?.writeText(wcUri); notify("Link copied!", "success"); }} className="px-3 py-2 text-xs font-medium rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] shrink-0">Copy</button>
              </div>
            </div>
            <p className="text-[10px] text-[#9B9B9B] text-center">After approving in wallet, return here — auto-connects.</p>
          </div>
        </div>
      )}
    </div>
  );
}
