import { useState } from "react";
import {
  isMobile,
  connectMetaMask,
  connectWalletConnect,
  type WalletState,
  type WalletType,
} from "@/lib/wallet";
import { Wallet, XCircle, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onConnect: (ws: WalletState, type: WalletType) => void;
  notify: (m: string, t?: string) => void;
  chainId: number;
}

export default function WalletModal({ show, onClose, onConnect, notify, chainId }: Props) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const mobile = isMobile();

  if (!show) return null;

  const handleMetaMask = async () => {
    setConnecting("metamask");
    try {
      const ws = await connectMetaMask();
      onConnect(ws, "metamask");
      onClose();
    } catch (e: any) {
      notify(e?.message || "MetaMask connect failed", "error");
    }
    setConnecting(null);
  };

  const handleWalletConnect = async () => {
    setConnecting("walletconnect");
    try {
      const ws = await connectWalletConnect(chainId || 1);
      onConnect(ws, "walletconnect");
      onClose();
    } catch (e: any) {
      // User cancel / dismiss modal bukan error sebenarnya
      const msg = e?.message || "";
      if (msg.includes("rejected") || msg.includes("User rejected") || msg.includes("disconnect") || msg.includes("closed") || msg.includes("modal")) {
        // silent — user cancelled
      } else {
        notify(msg || "WalletConnect failed", "error");
      }
    }
    setConnecting(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Wallet size={14} className="text-[#B8A9E8]" /> Connect Wallet
          </h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Browser Extension — desktop only */}
          {!mobile && (
            <button
              onClick={handleMetaMask}
              disabled={connecting !== null}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] transition-colors text-left group disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F5A623]/15">
                <svg width="18" height="18" viewBox="0 0 32 32">
                  <path d="M29.7 6L17.7 14.8l2.2-5.1z" fill="#E2761B" />
                  <path d="M3.3 6l11.8 8.8-2.1-5.1z" fill="#E4761B" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Browser Extension</p>
                <p className="text-[11px] text-[#6B6B6B]">MetaMask · Rabby</p>
              </div>
              {connecting === "metamask" ? (
                <Loader2 size={14} className="ml-auto animate-spin" />
              ) : (
                <ChevronRight size={14} className="ml-auto text-[#E0E0E0]" />
              )}
            </button>
          )}

          {/* WalletConnect — desktop: QR modal, mobile: deep-link */}
          <button
            onClick={handleWalletConnect}
            disabled={connecting !== null}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#4ECDC4]/30 bg-[#4ECDC4]/5 hover:bg-[#4ECDC4]/10 transition-colors text-left group disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#4ECDC4]/20">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="#115E59">
                <path d="M10.5 12.3c3-2.8 7.8-2.8 10.8 0l.4.3c.1.1.2.3 0 .4l-1.2 1.2c-.1.1-.2.1-.3 0l-.5-.5c-2.3-2.1-6.1-2.1-8.4 0zm13.3 2.5l1.1 1c.1.1.1.3 0 .4l-5 4.7c-.1.1-.3.1-.4 0l-3.5-3.3-3.5 3.3c-.1.1-.3.1-.4 0l-5-4.7c-.1-.1-.1-.3 0-.4l1.1-1c.1-.1.3-.1.4 0l3.5 3.3 3.5-3.3c.3-.2.6-.2.9 0l3.5 3.3 3.5-3.3c.1-.1.3-.1.4 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">
                {mobile ? "📱 Mobile Wallet" : "WalletConnect"}
              </p>
              <p className="text-[11px] text-[#6B6B6B]">
                {mobile
                  ? "One-tap → buka wallet app → approve"
                  : "Scan QR dengan HP kamu"}
              </p>
            </div>
            {connecting === "walletconnect" ? (
              <Loader2 size={14} className="ml-auto animate-spin" />
            ) : (
              <ChevronRight size={14} className="ml-auto text-[#E0E0E0]" />
            )}
          </button>

          {/* Mobile hint */}
          {mobile && (
            <p className="text-[10px] text-[#9B9B9B] text-center pt-2">
              WalletConnect akan membuka app wallet kamu langsung.
              <br />
              Setelah approve di wallet, kembali ke browser — otomatis connect.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
