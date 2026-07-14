import { useState } from "react";
import { ethers } from "ethers";
import { Zap, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { CHAINS } from "@/lib/chains";
import { NFT_ABI, METHOD_CANDIDATES } from "@/lib/abi";
import type { Target } from "@/lib/storage";

interface Props {
  addr: string;
  onSwitchChain: (k: string) => void;
  onClaim: (t: Target) => void;
  busy: string;
  notify: (m: string, t?: string) => void;
}

export default function Claim({ addr, onSwitchChain, onClaim, busy, notify }: Props) {
  const [form, setForm] = useState({ chain: "ethereum", method: "claim", amount: 1, autoApprove: true, contract: "" });
  const [probe, setProbe] = useState<any>(null);
  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  const probeContract = async () => {
    if (!window.ethereum || !ethers.isAddress(form.contract)) { notify("Invalid contract address", "error"); return; }
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      const ctr = new ethers.Contract(form.contract, NFT_ABI, p);
      const s: any = {};
      try { s.name = await ctr.name(); } catch {}
      try { s.symbol = await ctr.symbol(); } catch {}
      try { s.total = (await ctr.totalSupply()).toString(); } catch {}
      try { s.active = await ctr.saleActive(); } catch {}
      try { s.paused = await ctr.paused(); } catch {}
      try { s.price = await ctr.price(); } catch {}
      if (!s.price) try { s.price = await ctr.cost(); } catch {}
      setProbe(s); notify("Contract probe complete!", "success");
    } catch (e: any) { notify("Probe failed: " + (e?.shortMessage || e?.message), "error"); }
  };

  const doClaim = () => {
    onClaim({ id: "manual", name: "Manual", url: "", contract: form.contract, chain: form.chain, method: form.method, amount: form.amount, maxPerWallet: 5, autoApprove: form.autoApprove, status: "waiting", createdAt: new Date().toISOString().slice(0, 10) });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Zap size={14} className="text-[#4ADE80]"/> Manual Claim / Mint</h3>
        <p className="text-xs text-[#6B6B6B] mb-4">Enter a contract address to probe its state and claim/mint.</p>
        <div className="space-y-3">
          <Field label="Contract Address">
            <input value={form.contract} onChange={e => update("contract", e.target.value)} className="w-full px-4 py-2 text-sm font-mono border border-[#F0F0F0] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/30" placeholder="0x..."/>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Chain">
              <select value={form.chain} onChange={e => update("chain", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white">
                {Object.entries(CHAINS).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Method">
              <select value={form.method} onChange={e => update("method", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white">
                {METHOD_CANDIDATES.map(m => <option key={m} value={m}>{m}()</option>)}
              </select>
            </Field>
            <Field label="Amount">
              <input type="number" min={1} max={10} value={form.amount} onChange={e => update("amount", Math.min(10, Math.max(1, Number(e.target.value))))} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white"/>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-[#6B6B6B]">
            <input type="checkbox" checked={form.autoApprove} onChange={e => update("autoApprove", e.target.checked)}/> Auto approve wallet before claiming
          </label>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={probeContract} disabled={!addr || !form.contract} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full border border-[#F0F0F0] hover:bg-[#FAFAF8] disabled:opacity-40"><Eye size={14}/> Probe</button>
          <button onClick={doClaim} disabled={!addr || !form.contract || !!busy} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full bg-[#B8A9E8] text-[#1A1A1A] hover:bg-[#A89AD8] shadow-sm hover:shadow-md disabled:opacity-40">{busy ? <Loader2 size={14} className="animate-spin"/> : <Zap size={14}/>} Claim</button>
        </div>
        {!addr && <p className="mt-3 text-[11px] text-[#DC2626]">⚠ Connect your wallet first</p>}
      </div>
      {probe && (
        <div className="bg-white rounded-2xl border border-[#F0F0F0] p-6">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={14} className="text-[#4ADE80]"/> Contract State</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {Object.entries(probe).map(([k, v]: any) => (
              <div key={k} className="p-3 rounded-xl bg-[#FAFAF8] border border-[#F0F0F0]"><p className="text-[10px] text-[#9B9B9B] uppercase tracking-wide">{k}</p><p className="font-mono mt-1 truncate">{String(v)}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] font-medium text-[#9B9B9B] uppercase tracking-wide mb-1.5 block">{label}</label>{children}</div>;
}
