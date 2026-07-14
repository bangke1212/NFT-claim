import { Play, Settings, ExternalLink, AlertTriangle, Sparkles } from "lucide-react";

export default function Guide() {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Play size={14} className="text-[#4ADE80]"/> How to Use</h3>
        <div className="space-y-3">
          {[
            { n: 1, t: "Install Wallet", d: "MetaMask or Rabby browser extension" },
            { n: 2, t: "Connect Wallet", d: "Click Connect Wallet button top-right — supports extension + mobile WalletConnect" },
            { n: 3, t: "Add Target", d: "Fill: name, contract address, chain, method" },
            { n: 4, t: "Click Claim", d: "Bot auto-switches chain → auto-approves → mints" },
            { n: 5, t: "Check Status", d: "Target status auto-updates after TX confirmation" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-[#5B21B6] bg-[#B8A9E8]/15 border border-[#B8A9E8]/30">{s.n}</div>
              <div><p className="text-sm font-semibold">{s.t}</p><p className="text-xs text-[#6B6B6B]">{s.d}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Settings size={14} className="text-[#B8A9E8]"/> Deploy to Vercel</h3>
        <p className="text-xs text-[#6B6B6B] mb-3">This app is built with Vite + React. Import repo to Vercel and deploy.</p>
        <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-[#1A1A1A] text-white hover:bg-[#333]"><ExternalLink size={12}/> Open Vercel</a>
      </div>

      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles size={14} className="text-[#B8A9E8]"/> Tech Stack</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["Framework", "Vite + React 18"],
            ["Wallet", "ethers.js v6"],
            ["Mobile", "WalletConnect v2"],
            ["Chains", "10 EVM Networks"],
            ["Styling", "Tailwind CSS"],
            ["Deploy", "Vercel"],
          ].map(([k, v]) => (
            <div key={k} className="p-3 rounded-xl bg-[#FAFAF8] border border-[#F0F0F0]"><p className="text-[10px] text-[#9B9B9B] uppercase">{k}</p><p className="font-medium mt-0.5">{v}</p></div>
          ))}
        </div>
      </div>

      <div className="bg-[#FF6B6B]/5 border border-[#FF6B6B]/20 rounded-2xl p-5 flex gap-3">
        <AlertTriangle size={16} className="text-[#DC2626] shrink-0 mt-0.5"/>
        <div className="text-[11px] text-[#DC2626]">
          <p className="font-semibold mb-1">Disclaimer</p>
          <p>Bot operates via your browser wallet. Private key is NEVER sent to any server. Always verify contract addresses. Some platforms prohibit automated bots — check Terms of Service. Use at your own risk.</p>
        </div>
      </div>
    </div>
  );
}
