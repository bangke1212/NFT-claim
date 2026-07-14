import { Plus, Target as TargetIcon, Play, Trash2, Copy, ExternalLink, Link2, Shield, Loader2, CheckCircle2, Zap, Eye, XCircle, Clock } from "lucide-react";
import { CHAINS } from "@/lib/chains";
import type { Target } from "@/lib/storage";

const ACC = { L: "#B8A9E8", A: "#F5A623", T: "#4ECDC4", C: "#FF6B6B", G: "#4ADE80" };
const SM: any = { waiting: { c: ACC.A, t: "#92400E", l: "Waiting", I: Clock }, monitoring: { c: ACC.T, t: "#115E59", l: "Monitoring", I: Eye }, live: { c: ACC.G, t: "#166534", l: "LIVE", I: Zap }, claimed: { c: ACC.L, t: "#5B21B6", l: "Claimed", I: CheckCircle2 }, sold_out: { c: "#6B6B6B", t: "#6B6B6B", l: "Sold Out", I: XCircle }, failed: { c: ACC.C, t: "#DC2626", l: "Failed", I: XCircle } };

interface Props {
  targets: Target[];
  addr: string;
  busy: string;
  onAdd: () => void;
  onClaim: (t: Target) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, p: Partial<Target>) => void;
  onCopy: (x: string) => void;
}

export default function Targets({ targets, addr, busy, onAdd, onClaim, onDelete, onUpdate, onCopy }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-base font-bold">Mint / Claim Targets</h2><p className="text-[11px] text-[#9B9B9B] mt-0.5">{targets.length} targets · stored in localStorage</p></div>
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-[#B8A9E8] text-[#1A1A1A] hover:bg-[#A89AD8] shadow-sm hover:shadow-md"><Plus size={14}/> Add Target</button>
      </div>
      {targets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-12 text-center"><TargetIcon size={32} className="mx-auto mb-3 text-[#E0E0E0]"/><p className="text-sm text-[#6B6B6B] mb-1">No targets yet</p><p className="text-[11px] text-[#9B9B9B]">Add your first target to get started</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#F0F0F0] overflow-hidden divide-y divide-[#F0F0F0]">
          {targets.map(t => {
            const m = SM[t.status] || SM.waiting;
            const cm = CHAINS[t.chain];
            return (
              <div key={t.id} className="p-5 hover:bg-[#FAFAF8] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: m.c + "22" }}><m.I size={16} style={{ color: m.c }}/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{t.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide border" style={{ backgroundColor: m.c + "1A", color: m.t, borderColor: m.c + "33" }}>{m.l}</span>
                    </div>
                    {t.url && <a href={t.url} target="_blank" rel="noreferrer" className="text-[11px] text-[#5B21B6] hover:underline flex items-center gap-1 mb-2 truncate max-w-md"><Link2 size={10}/>{t.url}</a>}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {cm && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border" style={{ backgroundColor: cm.color + "22", borderColor: cm.color + "33" }}><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cm.color }}/>{cm.name}</span>}
                      <span className="text-[#6B6B6B]">Method: <code className="bg-[#F0F0F0] px-1.5 py-0.5 rounded font-mono">{t.method}()</code></span>
                      <span className="text-[#6B6B6B]">Max: {t.maxPerWallet}</span>
                      {t.autoApprove && <span className="inline-flex items-center gap-1 text-[#166534]"><Shield size={10}/>Approve</span>}
                    </div>
                    {t.contract && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <code className="text-[10px] font-mono text-[#6B6B6B] bg-[#F0F0F0] px-2 py-0.5 rounded truncate max-w-[280px]">{t.contract}</code>
                        <button onClick={() => onCopy(t.contract)} className="p-1 hover:bg-[#F0F0F0] rounded"><Copy size={10}/></button>
                        {cm && <a href={`${cm.explorer}/address/${t.contract}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-[#F0F0F0] rounded"><ExternalLink size={10}/></a>}
                      </div>
                    )}
                    {t.notes && <p className="text-[11px] text-[#9B9B9B] mt-2 italic">{t.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-[#F0F0F0]/60 rounded-full p-1">
                      <span className="text-[10px] text-[#6B6B6B] pl-2">Mint:</span>
                      <input type="number" min={1} max={10} value={t.amount} onChange={e => onUpdate(t.id, { amount: Math.min(10, Math.max(1, Number(e.target.value))) })} className="w-12 text-center text-xs font-semibold bg-white rounded-full py-1 border-0 focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/30"/>
                    </div>
                    <button onClick={() => onClaim(t)} disabled={!addr || busy === "c:" + t.id} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-40 shadow-sm hover:shadow-md transition-all">
                      {busy === "c:" + t.id ? <Loader2 size={11} className="animate-spin"/> : <Play size={11}/>} Claim
                    </button>
                    <button onClick={() => onDelete(t.id)} className="text-[10px] text-[#DC2626] hover:bg-[#FF6B6B]/10 px-2 py-1 rounded-full inline-flex items-center gap-1"><Trash2 size={10}/> Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
