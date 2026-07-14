import { useState } from "react";
import { Plus, XCircle } from "lucide-react";
import { CHAINS } from "@/lib/chains";
import type { Target } from "@/lib/storage";

interface Props {
  show: boolean;
  onClose: () => void;
  onAdd: (t: Target) => void;
  notify: (m: string, t?: string) => void;
}

const EMPTY = { name: "", url: "", contract: "", chain: "ethereum", method: "claim", amount: 1, maxPerWallet: 5, autoApprove: true, notes: "" };

export default function AddTargetModal({ show, onClose, onAdd, notify }: Props) {
  const [form, setForm] = useState(EMPTY);

  if (!show) return null;

  const handleAdd = () => {
    if (!form.name.trim()) { notify("Project name is required", "error"); return; }
    const t: Target = {
      ...form,
      id: Date.now().toString(),
      status: "waiting",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    onAdd(t);
    setForm(EMPTY);
    onClose();
    notify("Target added!", "success");
  };

  const update = (key: string, value: any) => setForm({ ...form, [key]: value });

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#F0F0F0] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="px-6 py-4 border-b border-[#F0F0F0] flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Plus size={14} className="text-[#B8A9E8]"/> Add Target</h3>
          <button onClick={onClose} className="text-[#9B9B9B] hover:text-[#1A1A1A]"><XCircle size={16}/></button>
        </div>
        <div className="p-6 space-y-4">
          <Field label="Project Name *">
            <input value={form.name} onChange={e => update("name", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/30" placeholder="e.g. Cool NFT Drop"/>
          </Field>
          <Field label="Minting URL">
            <input value={form.url} onChange={e => update("url", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/30" placeholder="https://..."/>
          </Field>
          <Field label="Contract Address *">
            <input value={form.contract} onChange={e => update("contract", e.target.value)} className="w-full px-4 py-2 text-sm font-mono border border-[#F0F0F0] rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-[#B8A9E8]/30" placeholder="0x..."/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Chain">
              <select value={form.chain} onChange={e => update("chain", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white">
                {Object.entries(CHAINS).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Method">
              <select value={form.method} onChange={e => update("method", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white">
                {["claim","mint","freeMint","publicMint","safeMint"].map(m => <option key={m} value={m}>{m}()</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount (1-10)">
              <input type="number" min={1} max={10} value={form.amount} onChange={e => update("amount", Math.min(10, Math.max(1, Number(e.target.value))))} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white"/>
            </Field>
            <Field label="Max per Wallet">
              <input type="number" min={1} max={100} value={form.maxPerWallet} onChange={e => update("maxPerWallet", Math.max(1, Number(e.target.value)))} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white"/>
            </Field>
          </div>
          <Field label="Auto Approve">
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => update("autoApprove", v)}
                  className={`flex-1 px-4 py-2 text-xs font-medium rounded-full border transition-all ${form.autoApprove === v ? "bg-[#B8A9E8]/15 text-[#5B21B6] border-[#B8A9E8]/30" : "bg-white text-[#6B6B6B] border-[#F0F0F0]"}`}>
                  {v ? "✓ Enabled" : "✗ Disabled"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <input value={form.notes || ""} onChange={e => update("notes", e.target.value)} className="w-full px-4 py-2 text-sm border border-[#F0F0F0] rounded-full bg-white" placeholder="Optional..."/>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-[#F0F0F0] flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#6B6B6B] hover:bg-[#F0F0F0] rounded-full">Cancel</button>
          <button onClick={handleAdd} className="px-5 py-2 text-sm font-medium rounded-full bg-[#B8A9E8] text-[#1A1A1A] hover:bg-[#A89AD8] shadow-sm inline-flex items-center gap-1.5"><Plus size={14}/> Add</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] font-medium text-[#9B9B9B] uppercase tracking-wide mb-1.5 block">{label}</label>{children}</div>;
}
