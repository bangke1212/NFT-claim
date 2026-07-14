import { useState } from "react";
import { isMobile, connectMetaMask, connectWalletConnectDesktop, startMobilePairing, finishMobilePairing, MOBILE_WALLETS, type WalletState, type WalletType } from "@/lib/wallet";
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
  const [step, setStep] = useState<"select" | "mobileWallets">("select");
  const [mobileUri, setMobileUri] = useState("");
  const mobile = isMobile();

  if (!show) return null;

  const reset = () => { setStep("select"); setMobileUri(""); };

  // Desktop: Browser Extension
  const connectMeta = async () => {
    setConnecting(true);
    try {
      const ws = await connectMetaMask();
      onConnect(ws, "metamask");
      reset(); onClose();
    } catch (e: any) {
      notify(e?.message || "MetaMask connect failed", "error");
    }
    setConnecting(false);
  };

  // Desktop: WalletConnect QR modal
  const connectWCDesktop = async () => {
    setConnecting(true);
    try {
      const ws = await connectWalletConnectDesktop(chainId || 1);
      onConnect(ws, "walletconnect");
      reset(); onClose();
    } catch (e: any) {
      notify(e?.message || "WalletConnect failed", "error");
    }
    setConnecting(false);
  };

  // Mobile Step 1: Generate URI, show wallet buttons
  const startMobile = async () => {
    setConnecting(true);
    try {
      const { uri } = await startMobilePairing(chainId || 1);
      setMobileUri(uri);
      setStep("mobileWallets");
    } catch (e: any) {
      notify(e?.message || "Failed to generate connection link", "error");
    }
    setConnecting(false);
  };

  // Mobile Step 2: Open wallet via deep link (SYNCHRONOUS — key fix!)
  const openMobileWallet = (walletKey: string) => {
    const wallet = MOBILE_WALLETS.find(w => w.key === walletKey);
    if (!wallet || !mobileUri) return;

    const deepLink = wallet.deepLink(mobileUri);

    // CRITICAL: must be synchronous in click handler, not inside async/await
    // Otherwise iOS/Android browsers block the navigation
    window.open(deepLink, "_blank", "noreferrer noopener");
    // Fallback for browsers that block window.open
    window.location.href = deepLink;

    // Listen for user returning from wallet app
    const handler = async () => {
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("focus", handler);
      try {
        const ws = await finishMobilePairing();
        onConnect(ws, "walletconnect");
        reset(); onClose();
      } catch (e: any) {
        notify(e?.message || "Connection failed after returning from wallet", "error");
      }
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("focus", handler);
  };

  // Step 1: Wallet Selection
  if (step === "select") {
    return (
      <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
          <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
              <Wallet size={14} className="text-[#B8A9E8]"/> Connect Wallet
            </h3>
            <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><XCircle size={16}/></button>
          </div>
          <div className="p-5 space-y-3">
            {/* Browser Extension — only on desktop */}
            {!mobile && (
              <button onClick={connectMeta} disabled={connecting}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] transition-colors text-left group disabled:opacity-50">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F5A623]/15">
                  <svg width="18" height="18" viewBox="0 0 32 32"><path d="M29.7 6L17.7 14.8l2.2-5.1z" fill="#E2761B"/><path d="M3.3 6l11.8 8.8-2.1-5.1z" fill="#E4761B"/></svg>
                </div>
                <div><p className="text-sm font-semibold">Browser Extension</p><p className="text-[11px] text-[#6B6B6B]">MetaMask · Rabby</p></div>
                {connecting ? <Loader2 size={14} className="ml-auto animate-spin"/> : <ChevronRight size={14} className="ml-auto text-[#E0E0E0]"/>}
              </button>
            )}

            {/* WalletConnect */}
            <button onClick={mobile ? startMobile : connectWCDesktop} disabled={connecting}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#4ECDC4]/30 bg-[#4ECDC4]/5 hover:bg-[#4ECDC4]/10 transition-colors text-left group disabled:opacity-50">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#4ECDC4]/20">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="#115E59"><path d="M10.5 12.3c3-2.8 7.8-2.8 10.8 0l.4.3c.1.1.2.3 0 .4l-1.2 1.2c-.1.1-.2.1-.3 0l-.5-.5c-2.3-2.1-6.1-2.1-8.4 0zm13.3 2.5l1.1 1c.1.1.1.3 0 .4l-5 4.7c-.1.1-.3.1-.4 0l-3.5-3.3-3.5 3.3c-.1.1-.3.1-.4 0l-5-4.7c-.1-.1-.1-.3 0-.4l1.1-1c.1-.1.3-.1.4 0l3.5 3.3 3.5-3.3c.3-.2.6-.2.9 0l3.5 3.3 3.5-3.3c.1-.1.3-.1.4 0z"/></svg>
              </div>
              <div><p className="text-sm font-semibold">{mobile ? "📱 Mobile Wallet" : "WalletConnect"}</p><p className="text-[11px] text-[#6B6B6B]">{mobile ? "Two-tap connect to wallet app" : "Scan QR with your phone"}</p></div>
              {connecting ? <Loader2 size={14} className="ml-auto animate-spin"/> : <ChevronRight size={14} className="ml-auto text-[#E0E0E0]"/>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Mobile — Choose wallet & open via deep link
  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
        <div className="px-5 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <button onClick={() => setStep("select")} className="text-[#6B6B6B] hover:text-[#1A1A1A] text-xs flex items-center gap-1">← Back</button>
          <h3 className="text-sm font-semibold">📱 Open Wallet App</h3>
          <button onClick={() => { reset(); onClose(); }} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><XCircle size={16}/></button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-[#6B6B6B] mb-1">Tap your wallet to connect:</p>
          {MOBILE_WALLETS.map((w) => (
            <button key={w.key} onClick={() => openMobileWallet(w.key)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] active:bg-[#F0F0F0] transition-colors text-left"
              style={{ borderLeftWidth: "3px", borderLeftColor: w.color }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: w.color + "20" }}>
                {w.key === "metamask" ? "🦊" : w.key === "trust" ? "🛡️" : w.key === "rainbow" ? "🌈" : "🔐"}
              </div>
              <div className="flex-1"><p className="text-sm font-semibold">{w.name}</p><p className="text-[11px] text-[#6B6B6B]">Tap → approve in wallet → return here</p></div>
              <ExternalLink size={14} className="text-[#9B9B9B]"/>
            </button>
          ))}
          <div className="pt-2 border-t border-[#F0F0F0]">
            <p className="text-[10px] text-[#9B9B9B] mb-2">Other wallet? Copy link & paste manually:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] font-mono text-[#6B6B6B] bg-[#F0F0F0] px-3 py-2 rounded-lg truncate">{mobileUri.slice(0, 50)}...</code>
              <button onClick={() => { navigator.clipboard?.writeText(mobileUri); notify("Link copied!", "success"); }}
                className="px-3 py-2 text-xs font-medium rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] shrink-0">Copy</button>
            </div>
          </div>
          <p className="text-[10px] text-[#9B9B9B] text-center mt-2">
            After approving in wallet app, come back to browser — auto-connects.
          </p>
        </div>
      </div>
    </div>
  );
}
