import { useState } from "react";
import { useItems, useMembers, createItem, updateItem, removeItem } from "../store";
import { Plus, X, Mic, User, Calendar } from "lucide-react";

const STAT = [
  { id: "planned", label: "Planned", dot: "bg-gray-400" },
  { id: "booked", label: "Booked", dot: "bg-blue-400" },
  { id: "recorded", label: "Recorded", dot: "bg-amber-400" },
  { id: "editing", label: "Editing", dot: "bg-purple-400" },
  { id: "published", label: "Published", dot: "bg-emerald-400" },
];

function fmtDate(ts: number) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

export function PodcastTracker() {
  const items = useItems("podcast");
  const members = useMembers();
  const [modal, setModal] = useState<"add" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [f, setF] = useState({ title: "", guest: "", assignee: "", dueDate: "" });

  const active = items.filter((i) => i.status !== "published");
  const published = items.filter((i) => i.status === "published");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{active.length} in pipeline</p>
        <button onClick={() => setModal("add")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition"><Plus size={14} /> New episode</button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {STAT.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${s.dot} mb-2`} />
            <div className="text-xl font-bold text-gray-900">{items.filter((i) => i.status === s.id).length}</div>
            <div className="text-[11px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {active.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">In Progress</h3></div>
          <div className="divide-y divide-gray-50">
            {active.map((item) => {
              const st = STAT.find((s) => s.id === item.status);
              return (
                <div key={item._id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setEditing({ ...item, dueDateStr: item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : "" })}>
                  <Mic size={18} className="text-pink-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {item.guest && <span className="flex items-center gap-1"><User size={11} /> {item.guest}</span>}
                      {item.assignee && <span>Host: {item.assignee}</span>}
                      {item.dueDate && <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(item.dueDate)}</span>}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${st?.dot}`} /><span className="text-xs text-gray-500">{st?.label}</span></span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {published.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-400">Published</h3></div>
          <div className="divide-y divide-gray-50">{published.map((item) => (
            <div key={item._id} className="px-5 py-3 flex items-center gap-3 text-gray-400">
              <Mic size={14} /><span className="text-sm flex-1">{item.title}</span>{item.guest && <span className="text-xs">{item.guest}</span>}<span className="text-xs text-emerald-500">✓</span>
            </div>
          ))}</div>
        </section>
      )}

      {modal === "add" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setModal(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-base font-semibold">New Episode</h3><button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" autoFocus /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Guest</label><input value={f.guest} onChange={(e) => setF({ ...f, guest: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Host</label><select value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"><option value="">—</option>{members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Date</label><input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
            </div>
            <button onClick={() => { if (!f.title.trim()) return; createItem({ type: "podcast", title: f.title.trim(), status: "planned", guest: f.guest || undefined, assignee: f.assignee || undefined, dueDate: f.dueDate ? new Date(f.dueDate).getTime() : undefined }); setF({ title: "", guest: "", assignee: "", dueDate: "" }); setModal(null); }} disabled={!f.title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-medium transition">Add</button>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setEditing(null)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h3 className="text-base font-semibold">Edit Episode</h3><button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            <input value={editing.guest || ""} onChange={(e) => setEditing({ ...editing, guest: e.target.value })} placeholder="Guest" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
            <div className="grid grid-cols-3 gap-3">
              <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">{STAT.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
              <select value={editing.assignee || ""} onChange={(e) => setEditing({ ...editing, assignee: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"><option value="">—</option>{members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}</select>
              <input type="date" value={editing.dueDateStr || ""} onChange={(e) => setEditing({ ...editing, dueDateStr: e.target.value })} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { updateItem(editing._id, { title: editing.title, guest: editing.guest || undefined, status: editing.status, assignee: editing.assignee || undefined, dueDate: editing.dueDateStr ? new Date(editing.dueDateStr).getTime() : undefined }); setEditing(null); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition">Save</button>
              <button onClick={() => { removeItem(editing._id); setEditing(null); }} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
