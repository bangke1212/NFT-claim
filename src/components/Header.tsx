import { Rocket, Wallet, Loader2, LogOut } from "lucide-react";
import { chainById } from "@/lib/chains";
import type { WalletType } from "@/lib/wallet";

interface Props {
  addr: string;
  bal: string;
  cid: number;
  walletType: WalletType;
  tab: string;
  onTab: (tab: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting?: boolean;
}

export default function Header({ addr, bal, cid, walletType, tab, onTab, onConnect, onDisconnect, connecting }: Props) {
  const cc = chainById(cid);
  const short = (a: string) => a ? a.slice(0, 6) + "..." + a.slice(-4) : "";

  const tabs = [
    { id: "overview", l: "Overview" },
    { id: "targets", l: "Targets" },
    { id: "claim", l: "Claim" },
    { id: "guide", l: "Guide" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#F0F0F0]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center"><Rocket size={16} className="text-white"/></div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                NFT Auto Claim Bot
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#B8A9E8]/15 text-[#5B21B6] border border-[#B8A9E8]/30">v1.0</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#9B9B9B] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulseDot"/>Auto Claim · Mint · Approve — Vite + Vercel
              </p>
            </div>
          </div>

          {!addr ? (
            connecting ? (
              <button disabled className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-[#F0F0F0] text-[#6B6B6B]">
                <Loader2 size={14} className="animate-spin"/><span className="hidden sm:inline">Connecting...</span>
              </button>
            ) : (
              <button onClick={onConnect} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-[#B8A9E8] text-[#1A1A1A] hover:bg-[#A89AD8] shadow-sm hover:shadow-md transition-all">
                <Wallet size={14}/><span className="hidden sm:inline">Connect Wallet</span>
              </button>
            )
          ) : (
            <div className="flex items-center gap-2">
              {walletType !== "none" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[#4ECDC4]/10 text-[#115E59] border border-[#4ECDC4]/20 hidden sm:inline">
                  {walletType === "walletconnect" ? "📱 Mobile" : "🦊 MetaMask"}
                </span>
              )}
              {cc && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#F0F0F0] bg-white text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cc.color }}/><span className="font-medium">{cc.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F0F0F0]/60 text-xs">
                <Wallet size={12} className="text-[#5B21B6]"/>
                <span className="font-mono">{short(addr)}</span>
                <span className="text-[#6B6B6B]">·</span>
                <span className="font-medium">{Number(bal).toFixed(3)}</span>
              </div>
              <button onClick={onDisconnect} className="p-1.5 rounded-full hover:bg-[#F0F0F0]"><LogOut size={14}/></button>
            </div>
          )}
        </div>

        <div className="flex gap-1 mt-4 bg-[#F0F0F0]/60 rounded-full p-1 w-fit overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => onTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                tab === t.id ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#6B6B6B] hover:text-[#1A1A1A]"
              }`}>
              {t.l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
