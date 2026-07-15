import { useState } from "react";
import {
  hasMetaMask,
  isMobileDevice,
  connectMetaMask,
  getMetaMaskDeepLink,
  getMetaMaskPlayStoreLink,
  type WalletState,
  type WalletType,
} from "@/lib/wallet";
import { Wallet, XCircle, ChevronRight, Loader2, ExternalLink, Smartphone, Monitor } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onConnect: (ws: WalletState, type: WalletType) => void;
  notify: (m: string, t?: string) => void;
  chainId: number;
}

export default function WalletModal({ show, onClose, onConnect, notify }: Props) {
  const [connecting, setConnecting] = useState(false);
  const mobile = isMobileDevice();
  const mmAvailable = hasMetaMask();

  if (!show) return null;

  // Normal connect: MetaMask tersedia
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const ws = await connectMetaMask();
      onConnect(ws, "metamask");
      onClose();
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("rejected") || msg.includes("User rejected")) {
        // user cancel — silent
      } else {
        notify(msg || "MetaMask connect failed", "error");
      }
    }
    setConnecting(false);
  };

  // Mobile: buka di MetaMask Mobile browser
  const handleOpenInMetaMask = () => {
    const deepLink = getMetaMaskDeepLink();
    window.open(deepLink, "_blank", "noreferrer noopener");
    setTimeout(() => { window.location.href = deepLink; }, 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Wallet size={14} className="text-[#B8A9E8]" /> Connect MetaMask
          </h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* === MetaMask tersedia → connect langsung === */}
          <button
            onClick={handleConnect}
            disabled={!mmAvailable || connecting}
            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors text-left group ${
              mmAvailable
                ? "border-[#F0F0F0] hover:bg-[#FAFAF8]"
                : "border-[#F0F0F0] opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F5A623]/15">
              <svg width="18" height="18" viewBox="0 0 32 32">
                <path d="M29.7 6L17.7 14.8l2.2-5.1z" fill="#E2761B" />
                <path d="M3.3 6l11.8 8.8-2.1-5.1z" fill="#E4761B" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {mmAvailable ? "MetaMask" : "MetaMask Not Detected"}
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                {mmAvailable
                  ? mobile ? "🟢 MetaMask Mobile browser" : "🟢 Browser Extension Ready"
                  : "Install MetaMask to continue"}
              </p>
            </div>
            {connecting ? (
              <Loader2 size={14} className="ml-auto animate-spin" />
            ) : mmAvailable ? (
              <ChevronRight size={14} className="ml-auto text-[#E0E0E0]" />
            ) : null}
          </button>

          {/* === Download / Install links === */}
          {!mmAvailable && (
            <div className="space-y-2 pt-1">
              {mobile ? (
                <>
                  {/* Mobile: Open in MetaMask App */}
                  <button
                    onClick={handleOpenInMetaMask}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F5A623]/40 bg-[#F5A623]/8 hover:bg-[#F5A623]/15 transition-colors text-left"
                    style={{ borderLeftWidth: "3px", borderLeftColor: "#F5A623" }}
                  >
                    <span className="text-lg">🦊</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Open in MetaMask App</p>
                      <p className="text-[11px] text-[#6B6B6B]">Tap → buka dApp di MetaMask Mobile</p>
                    </div>
                    <ExternalLink size={14} className="text-[#F5A623]" />
                  </button>

                  {/* Play Store */}
                  {/Android/i.test(navigator.userAgent) && (
                    <a
                      href={getMetaMaskPlayStoreLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#4ECDC4]/15">
                        <Smartphone size={16} className="text-[#4ECDC4]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-[#6B6B6B]">Download MetaMask (Play Store)</p>
                      </div>
                      <ExternalLink size={12} className="text-[#9B9B9B]" />
                    </a>
                  )}

                  <p className="text-[10px] text-[#9B9B9B] text-center pt-2">
                    Setelah buka di MetaMask, wallet akan auto-connect.
                  </p>
                </>
              ) : (
                <>
                  {/* Desktop: Download extension */}
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F5A623]/30 bg-[#F5A623]/5 hover:bg-[#F5A623]/10 transition-colors"
                    style={{ borderLeftWidth: "3px", borderLeftColor: "#F5A623" }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F5A623]/20">
                      <Monitor size={16} className="text-[#F5A623]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Install MetaMask Extension</p>
                      <p className="text-[11px] text-[#6B6B6B]">Chrome · Firefox · Brave · Edge</p>
                    </div>
                    <ExternalLink size={14} className="text-[#F5A623]" />
                  </a>

                  <p className="text-[10px] text-[#9B9B9B] text-center pt-2">
                    Refresh halaman setelah install extension.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
