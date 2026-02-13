import { useState } from "react";
import { useItems, useMembers, createItem, updateItem, updateStatus, removeItem } from "../store";
import { Plus, X, Building2, ArrowRight } from "lucide-react";

const STAT = [
  { id: "requested", label: "Requested", dot: "bg-gray-400" },
  { id: "accepted", label: "Accepted", dot: "bg-blue-400" },
  { id: "in_progress", label: "In Progress", dot: "bg-amber-400" },
  { id: "delivered", label: "Delivered", dot: "bg-emerald-400" },
];
const REQ_TYPES = ["Article", "Paid Engagement", "Research Brief", "Market Report", "GTM Strategy", "Other"];

export function PortfolioRequests() {
  const items = useItems("portfolio");
  const members = useMembers();
  const [modal, setModal] = useState<"add" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [f, setF] = useState({ title: "", company: "", requestType: "Article", assignee: "", notes: "" });

  const active = items.filter((i) => i.status !== "delivered");
  const delivered = items.filter((i) => i.status === "delivered");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{active.length} active</p>
        <button onClick={() => setModal("add")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition"><Plus size={14} /> New request</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.dot} mb-2`} />
            <div className="text-xl font-bold text-gray-900">{items.filter((i) => i.status === s.id).length}</div>
            <div className="text-[11px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Active</h3></div>
        {active.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">No active requests</p> : (
          <div className="divide-y divide-gray-50">
            {active.map((item) => {
              const st = STAT.find((s) => s.id === item.status);
              const idx = STAT.findIndex((s) => s.id === item.status);
              const next = idx < STAT.length - 1 ? STAT[idx + 1] : null;
              return (
                <div key={item._id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setEditing({ ...item })}>
                  <Building2 size={18} className="text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {item.company && <span className="font-medium text-gray-500">{item.company}</span>}
                      {item.requestType && <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{item.requestType}</span>}
                      {item.assignee && <span>{item.assignee}</span>}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${st?.dot}`} /><span className="text-xs text-gray-500">{st?.label}</span></span>
                  {next && (
                    <button onClick={(e) => { e.stopPropagation(); updateStatus(item._id, next.id); }}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-100 px-2 py-1 rounded transition">
                      <ArrowRight size={11} /> {next.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {delivered.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-400">Delivered</h3></div>
          <div className="divide-y divide-gray-50">{delivered.map((item) => (
            <div key={item._id} className="px-5 py-3 flex items-center gap-3 text-gray-400">
              <Building2 size={14} /><span className="text-sm flex-1">{item.title}</span><span className="text-xs">{item.company}</span><span className="text-xs text-emerald-500">✓</span>
            </div>
          ))}</div>
        </section>
      )}

      {modal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setModal(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-base font-semibold">New Request</h3><button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Company</label><input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Type</label><select value={f.requestType} onChange={(e) => setF({ ...f, requestType: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">{REQ_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Assignee</label><select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"><option value="">Unassigned</option>{members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
            <button onClick={() => { if (!f.title.trim()) return; createItem({ type: "portfolio", title: f.title.trim(), status: "requested", company: f.company || undefined, requestType: f.requestType, assignee: f.assignee || undefined, notes: f.notes || undefined }); setF({ title: "", company: "", requestType: "Article", assignee: "", notes: "" }); setModal(null); }} disabled={!f.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-medium transition">Add</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setEditing(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-base font-semibold">Edit Request</h3><button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            <div className="grid grid-cols-2 gap-3">
              <input value={editing.company || ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} placeholder="Company" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">{STAT.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={editing.requestType || "Article"} onChange={(e) => setEditing({ ...editing, requestType: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">{REQ_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              <select value={editing.assignee || ""} onChange={(e) => setEditing({ ...editing, assignee: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="">—</option>{members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { updateItem(editing._id, { title: editing.title, company: editing.company || undefined, requestType: editing.requestType, status: editing.status, assignee: editing.assignee || undefined }); setEditing(null); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition">Save</button>
              <button onClick={() => { removeItem(editing._id); setEditing(null); }} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
