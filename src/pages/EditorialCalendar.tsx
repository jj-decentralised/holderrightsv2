import { useState } from "react";
import { useItems, useMembers, createItem, updateItem, removeItem } from "../store";
import { Plus, X, Filter } from "lucide-react";

const STATUSES = ["pitch", "assigned", "drafting", "review", "copy_edit", "ready", "published"] as const;
const STATUS_DOT: Record<string, string> = { pitch: "bg-gray-400", assigned: "bg-blue-400", drafting: "bg-amber-400", review: "bg-purple-400", copy_edit: "bg-pink-400", ready: "bg-teal-400", published: "bg-emerald-400" };
const STATUS_LABEL: Record<string, string> = { pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit", ready: "Ready", published: "Published" };
const CATEGORIES = [
  { id: "organic", label: "Organic", cls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { id: "sponsored", label: "Sponsored", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { id: "collaboration", label: "Collab", cls: "bg-sky-50 text-sky-600 border-sky-100" },
  { id: "internal_research", label: "Research", cls: "bg-amber-50 text-amber-600 border-amber-100" },
];

function fmtDate(ts: number) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function isOverdue(i: any) { return i.dueDate && i.dueDate < Date.now() && i.status !== "published"; }

export function EditorialCalendar() {
  const items = useItems("editorial");
  const members = useMembers();
  const [filterCat, setFilterCat] = useState("all");
  const [filterWriter, setFilterWriter] = useState("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [modal, setModal] = useState<"add" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [f, setF] = useState({ title: "", assignee: "", category: "organic", dueDate: "", notes: "", status: "pitch" });

  const filtered = items.filter((i) => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (filterWriter !== "all" && i.assignee !== filterWriter) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (isOverdue(a) && !isOverdue(b)) return -1;
    if (!isOverdue(a) && isOverdue(b)) return 1;
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    return 1;
  });
  const writers = [...new Set(items.map((i) => i.assignee).filter(Boolean))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">{filtered.length} articles</p>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {(["list", "board"] as const).map((m) => (
              <button key={m} onClick={() => setView(m)}
                className={`px-3 py-1.5 text-xs font-medium transition ${view === m ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {m === "list" ? "List" : "Board"}
              </button>
            ))}
          </div>
          <button onClick={() => setModal("add")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition"><Plus size={14} /> Add article</button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-gray-400" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="all">All types</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={filterWriter} onChange={(e) => setFilterWriter(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="all">All writers</option>
          {writers.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      {view === "board" && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto">
          {STATUSES.map((st) => {
            const col = filtered.filter((i) => i.status === st);
            return (
              <div key={st} className="bg-gray-50 rounded-xl border border-gray-200 min-w-[160px]">
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[st]}`} />
                  <span className="text-[11px] font-semibold text-gray-600">{STATUS_LABEL[st]}</span>
                  <span className="ml-auto text-[11px] text-gray-400">{col.length}</span>
                </div>
                <div className="p-1.5 space-y-1.5 min-h-[120px]">
                  {col.map((i) => {
                    const cat = CATEGORIES.find((c) => c.id === i.category);
                    return (
                      <div key={i._id} onClick={() => setEditing({ ...i, dueDateStr: i.dueDate ? new Date(i.dueDate).toISOString().split("T")[0] : "" })}
                        className={`bg-white border rounded-lg p-2 cursor-pointer hover:shadow-sm transition text-xs ${isOverdue(i) ? "border-red-200" : "border-gray-100"}`}>
                        <div className="font-medium text-gray-900 line-clamp-2">{i.title}</div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {cat && <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${cat.cls}`}>{cat.label}</span>}
                          {i.assignee && <span className="text-gray-400 text-[10px]">{i.assignee}</span>}
                        </div>
                        {i.dueDate && <div className={`text-[10px] mt-1 ${isOverdue(i) ? "text-red-500 font-medium" : "text-gray-400"}`}>{fmtDate(i.dueDate)}{isOverdue(i) && " ⚠"}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "list" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-gray-400 text-xs">
              <th className="text-left px-5 py-2.5 font-medium">Article</th>
              <th className="text-left px-3 py-2.5 font-medium">Type</th>
              <th className="text-left px-3 py-2.5 font-medium">Stage</th>
              <th className="text-left px-3 py-2.5 font-medium">Writer</th>
              <th className="text-left px-3 py-2.5 font-medium">Due</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((i) => {
                const cat = CATEGORIES.find((c) => c.id === i.category);
                const overdue = isOverdue(i);
                return (
                  <tr key={i._id} onClick={() => setEditing({ ...i, dueDateStr: i.dueDate ? new Date(i.dueDate).toISOString().split("T")[0] : "" })}
                    className={`cursor-pointer hover:bg-gray-50 transition ${overdue ? "bg-red-50/50" : ""}`}>
                    <td className="px-5 py-3 font-medium text-gray-900">{i.title}</td>
                    <td className="px-3 py-3">{cat && <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cat.cls}`}>{cat.label}</span>}</td>
                    <td className="px-3 py-3"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[i.status]}`} /><span className="text-xs text-gray-600">{STATUS_LABEL[i.status]}</span></span></td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{i.assignee || "—"}</td>
                    <td className={`px-3 py-3 text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>{i.dueDate ? fmtDate(i.dueDate) : "—"}{overdue && " ⚠"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === "add" && <ModalForm title="New Article" onClose={() => setModal(null)} members={members} initial={f} onSave={(d: any) => { createItem({ type: "editorial", title: d.title, status: d.status, assignee: d.assignee || undefined, category: d.category, dueDate: d.dueDate ? new Date(d.dueDate).getTime() : undefined, notes: d.notes || undefined }); setModal(null); }} />}
      {editing && <ModalForm title="Edit Article" onClose={() => setEditing(null)} members={members} initial={{ title: editing.title, assignee: editing.assignee || "", category: editing.category || "organic", dueDate: editing.dueDateStr || "", notes: editing.notes || "", status: editing.status }} onSave={(d: any) => { updateItem(editing._id, { title: d.title, status: d.status, assignee: d.assignee || undefined, category: d.category, dueDate: d.dueDate ? new Date(d.dueDate).getTime() : undefined, notes: d.notes || undefined }); setEditing(null); }} onDelete={() => { removeItem(editing._id); setEditing(null); }} />}
    </div>
  );
}

function ModalForm({ title, onClose, members, initial, onSave, onDelete }: any) {
  const [d, setD] = useState(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e: any) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="text-base font-semibold">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
        <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label><input value={d.title} onChange={(e: any) => setD({ ...d, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Type</label><select value={d.category} onChange={(e: any) => setD({ ...d, category: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Stage</label><select value={d.status} onChange={(e: any) => setD({ ...d, status: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Writer</label><select value={d.assignee} onChange={(e: any) => setD({ ...d, assignee: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"><option value="">Unassigned</option>{members.map((m: any) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Due</label><input type="date" value={d.dueDate} onChange={(e: any) => setD({ ...d, dueDate: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
        </div>
        <div><label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label><textarea value={d.notes} onChange={(e: any) => setD({ ...d, notes: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" /></div>
        <div className="flex gap-2">
          <button onClick={() => onSave(d)} disabled={!d.title.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-medium transition">Save</button>
          {onDelete && <button onClick={onDelete} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition">Delete</button>}
        </div>
      </div>
    </div>
  );
}
