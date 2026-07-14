import { Target as TargetIcon, Wallet, Zap, Eye, CheckCircle2, Plus, Activity, Copy, Link2, Shield, Sparkles, Network } from "lucide-react";
import { CHAINS, chainById } from "@/lib/chains";
import type { Target } from "@/lib/storage";

const ACC = { L: "#B8A9E8", A: "#F5A623", T: "#4ECDC4", C: "#FF6B6B", G: "#4ADE80", K: "#1A1A1A" };

interface Props {
  targets: Target[];
  addr: string;
  bal: string;
  cid: number;
  onAdd: () => void;
  onCopy: (x: string) => void;
  onSwitchChain: (k: string) => void;
}

export default function Overview({ targets, addr, bal, cid, onAdd, onCopy, onSwitchChain }: Props) {
  const stats = {
    total: targets.length,
    wait: targets.filter(t => t.status === "monitoring" || t.status === "waiting").length,
    live: targets.filter(t => t.status === "live").length,
    claimed: targets.filter(t => t.status === "claimed").length,
  };
  const cc = chainById(cid);
  const short = (a: string) => a ? a.slice(0, 6) + "..." + a.slice(-4) : "";

  const SM: any = { waiting: { c: ACC.A, t: "#92400E", l: "Waiting", I: Eye }, monitoring: { c: ACC.T, t: "#115E59", l: "Monitoring", I: Eye }, live: { c: ACC.G, t: "#166534", l: "LIVE", I: Zap }, claimed: { c: ACC.L, t: "#5B21B6", l: "Claimed", I: CheckCircle2 }, sold_out: { c: "#6B6B6B", t: "#6B6B6B", l: "Sold Out", I: CheckCircle2 }, failed: { c: ACC.C, t: "#DC2626", l: "Failed", I: CheckCircle2 } };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[{ l: "Total Targets", v: stats.total, I: TargetIcon, c: ACC.L }, { l: "Waiting", v: stats.wait, I: Eye, c: ACC.A }, { l: "Live", v: stats.live, I: Zap, c: ACC.G }, { l: "Claimed", v: stats.claimed, I: CheckCircle2, c: ACC.T }].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#F0F0F0] p-4 sm:p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.c + "22" }}><s.I size={14} style={{ color: s.c }}/></div>
              <span className="text-2xl font-bold">{s.v}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#9B9B9B] font-medium uppercase tracking-wide">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Wallet size={14} className="text-[#B8A9E8]"/> Wallet EVM</h3>
          {addr ? (
            <div className="space-y-3">
              <div><p className="text-[10px] text-[#9B9B9B] uppercase tracking-wide mb-1">Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-[#F0F0F0] px-2 py-1 rounded-md truncate flex-1">{addr}</code>
                  <button onClick={() => onCopy(addr)} className="p-1.5 hover:bg-[#F0F0F0] rounded-md"><Copy size={12} className="text-[#6B6B6B]"/></button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div><p className="text-[10px] text-[#9B9B9B] uppercase">Balance</p><p className="text-sm font-bold">{Number(bal).toFixed(4)} {cc?.symbol || "ETH"}</p></div>
                <div><p className="text-[10px] text-[#9B9B9B] uppercase">Network</p><p className="text-sm font-bold">{cc?.name || "Unknown"}</p></div>
              </div>
              <div className="flex items-center gap-2 text-xs pt-2 border-t border-[#F0F0F0]"><Shield size={12} className="text-[#4ADE80]"/><span className="text-[#166534] font-medium">Auto Approve Ready</span></div>
            </div>
          ) : (
            <div className="text-center py-6"><Wallet size={28} className="mx-auto mb-3 text-[#E0E0E0]"/><p className="text-sm text-[#6B6B6B]">Wallet not connected</p></div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Network size={14} className="text-[#4ECDC4]"/> Networks</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(CHAINS).map(([k, v]) => (
              <button key={k} onClick={() => addr && onSwitchChain(k)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors ${cid === v.id ? "border-[#B8A9E8] bg-[#B8A9E8]/10" : "border-[#F0F0F0] hover:bg-[#FAFAF8]"}`}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }}/><span className="text-xs font-medium">{v.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Activity size={14} className="text-[#F5A623]"/> Recent Targets</h3>
          <button onClick={onAdd} className="inline-flex items-center gap-1 text-xs text-[#5B21B6] hover:bg-[#B8A9E8]/10 px-2 py-1 rounded-full"><Plus size={12}/> Add</button>
        </div>
        {targets.length === 0 ? (
          <div className="text-center py-8"><TargetIcon size={28} className="mx-auto mb-3 text-[#E0E0E0]"/><p className="text-sm text-[#9B9B9B]">No targets. Click <span className="font-medium text-[#5B21B6]">+ Add</span> to start.</p></div>
        ) : (
          <div className="space-y-2">{targets.slice(0, 5).map(t => {
            const m = SM[t.status] || SM.waiting; const cm = CHAINS[t.chain];
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0F0F0] hover:bg-[#FAFAF8] transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.c + "22" }}><m.I size={14} style={{ color: m.c }}/></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{t.name}</p><p className="text-[11px] text-[#9B9B9B] flex items-center gap-1.5">{cm && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cm.color }}/>}{cm?.name} · {t.method}() · x{t.amount}</p></div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: m.c + "1A", color: m.t, borderColor: m.c + "33" }}>{m.l}</span>
              </div>
            );
          })}</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Sparkles size={14} className="text-[#B8A9E8]"/> Features</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[{ I: Link2, c: ACC.L, t: "Auto Connect URL", d: "Minting URL per target" }, { I: Zap, c: ACC.G, t: "Auto Claim/Mint", d: "Auto-detect method signature" }, { I: Shield, c: ACC.A, t: "Auto Approve EVM", d: "setApprovalForAll automatic" }, { I: Eye, c: ACC.T, t: "Contract Probe", d: "Check supply, price, status" }, { I: TargetIcon, c: ACC.C, t: "Batch Mint 1-10", d: "Configurable per target" }, { I: Network, c: ACC.L, t: "Multi-Chain", d: "10 EVM networks" }].map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-[#F0F0F0]"><div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: f.c + "22" }}><f.I size={14} style={{ color: f.c }}/></div><div><p className="text-xs font-semibold">{f.t}</p><p className="text-[11px] text-[#6B6B6B] mt-0.5">{f.d}</p></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
