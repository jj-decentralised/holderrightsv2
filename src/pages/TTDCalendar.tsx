import { useState } from "react";
import { useItems, useMembers, createItem, updateItem, updateStatus, removeItem } from "../store";
import { Plus, X, CheckCircle, Clock, FileEdit } from "lucide-react";

const STAT = [
  { id: "planned", label: "Planned", icon: <Clock size={13} />, color: "text-gray-400" },
  { id: "drafting", label: "Drafting", icon: <FileEdit size={13} />, color: "text-amber-500" },
  { id: "published", label: "Published", icon: <CheckCircle size={13} />, color: "text-emerald-500" },
];

function fmtDate(ts: number) { return new Date(ts).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
function getWeekNum(d: Date) { const s = new Date(d.getFullYear(), 0, 1); return Math.ceil(((d.getTime() - s.getTime()) / 86400000 + s.getDay() + 1) / 7); }

export function TTDCalendar() {
  const items = useItems("ttd");
  const members = useMembers();
  const [modal, setModal] = useState<"add" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [f, setF] = useState({ title: "", assignee: "", dueDate: "" });

  const weeks: Record<number, typeof items> = {};
  items.forEach((i) => { const w = i.weekNumber || (i.dueDate ? getWeekNum(new Date(i.dueDate)) : 0); (weeks[w] ||= []).push(i); });
  const sortedWeeks = Object.keys(weeks).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          {STAT.map((s) => <span key={s.id} className={`flex items-center gap-1 text-xs ${s.color}`}>{s.icon} {s.label}</span>)}
        </div>
        <button onClick={() => setModal("add")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition"><Plus size={14} /> Add article</button>
      </div>

      {sortedWeeks.map((wk) => {
        const wi = weeks[wk].sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
        const done = wi.filter((i) => i.status === "published").length;
        return (
          <section key={wk} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Week {wk}</h3>
                <span className="text-xs text-gray-400">{done}/{wi.length} published</span>
              </div>
              <div className="w-20 bg-gray-100 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${wi.length > 0 ? (done / wi.length) * 100 : 0}%` }} /></div>
            </div>
            <div className="divide-y divide-gray-50">
              {wi.map((item) => {
                const st = STAT.find((s) => s.id === item.status);
                return (
                  <div key={item._id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => setEditing({ ...item, dueDateStr: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "" })}>
                    <button onClick={(e) => { e.stopPropagation(); const next = item.status === "planned" ? "drafting" : item.status === "drafting" ? "published" : "planned"; updateStatus(item._id, next); }}
                      className={`flex-shrink-0 ${st?.color}`}>{st?.icon}</button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${item.status === "published" ? "line-through text-gray-400" : "text-gray-900"}`}>{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400 w-20">{item.assignee || "—"}</span>
                    <span className="text-xs text-gray-400 w-28 text-right tabular-nums">{item.dueDate ? fmtDate(item.dueDate) : "—"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {modal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setModal(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-base font-semibold">New TTD Article</h3><button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Writer</label><select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"><option value="">Unassigned</option>{members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Publish date</label><input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
            </div>
            <button onClick={() => { if (!f.title.trim()) return; const d = f.dueDate ? new Date(f.dueDate).getTime() : undefined; createItem({ type: "ttd", title: f.title.trim(), status: "planned", assignee: f.assignee || undefined, dueDate: d, weekNumber: d ? getWeekNum(new Date(d)) : undefined }); setF({ title: "", assignee: "", dueDate: "" }); setModal(null); }} disabled={!f.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-medium transition">Add</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setEditing(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-base font-semibold">Edit</h3><button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            <div className="grid grid-cols-3 gap-3">
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">{STAT.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              <select value={editing.assignee || ""} onChange={(e) => setEditing({ ...editing, assignee: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="">—</option>{members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select>
              <input type="date" value={editing.dueDateStr || ""} onChange={(e) => setEditing({ ...editing, dueDateStr: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { updateItem(editing._id, { title: editing.title, status: editing.status, assignee: editing.assignee || undefined, dueDate: editing.dueDateStr ? new Date(editing.dueDateStr).getTime() : undefined }); setEditing(null); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition">Save</button>
              <button onClick={() => { removeItem(editing._id); setEditing(null); }} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
