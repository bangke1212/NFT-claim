import { useState } from "react";
import { connectMetaMask, type WalletState, type WalletType } from "@/lib/wallet";
import { Wallet, XCircle, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onConnect: (ws: WalletState, type: WalletType) => void;
  notify: (m: string, t?: string) => void;
  chainId: number;
}

export default function WalletModal({ show, onClose, onConnect, notify }: Props) {
  const [connecting, setConnecting] = useState(false);

  if (!show) return null;

  const handleConnect = async () => {
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

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
            <Wallet size={14} className="text-[#B8A9E8]" /> Connect MetaMask
          </h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
            <XCircle size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] transition-colors text-left group disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#F5A623]/15">
              <svg width="18" height="18" viewBox="0 0 32 32">
                <path d="M29.7 6L17.7 14.8l2.2-5.1z" fill="#E2761B" />
                <path d="M3.3 6l11.8 8.8-2.1-5.1z" fill="#E4761B" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">MetaMask</p>
              <p className="text-[11px] text-[#6B6B6B]">Browser Extension · Rabby compatible</p>
            </div>
            {connecting ? (
              <Loader2 size={14} className="ml-auto animate-spin" />
            ) : (
              <ChevronRight size={14} className="ml-auto text-[#E0E0E0]" />
            )}
          </button>

          <p className="text-[10px] text-[#9B9B9B] text-center pt-1">
            Belum install?{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
               className="text-[#5B21B6] underline hover:text-[#7C3AED]">
              Download MetaMask
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
