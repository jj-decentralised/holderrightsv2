import { useState, useRef } from "react";
import { useItems, useMembers, createItem, updateItem, removeItem, updateStatus } from "../store";
import type { ContentItem } from "../store";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { Plus, X, Filter, GripVertical, Palette, ExternalLink, ArrowRightLeft, DollarSign } from "lucide-react";

const STATUSES = ["pitch", "assigned", "drafting", "review", "copy_edit", "ready", "published"] as const;
const STATUS_DOT: Record<string, string> = { pitch: "bg-gray-400", assigned: "bg-blue-400", drafting: "bg-amber-400", review: "bg-purple-400", copy_edit: "bg-pink-400", ready: "bg-teal-400", published: "bg-emerald-400" };
const STATUS_LABEL: Record<string, string> = { pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit", ready: "Ready", published: "Published" };
const CATEGORIES = [
  { id: "organic", label: "Organic", cls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { id: "sponsored", label: "Sponsored", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { id: "collaboration", label: "Collab", cls: "bg-sky-50 text-sky-600 border-sky-100" },
  { id: "internal_research", label: "Research", cls: "bg-amber-50 text-amber-600 border-amber-100" },
];

const ART_STATUSES = [
  { id: "none", label: "No art needed" },
  { id: "needs_art", label: "Needs art" },
  { id: "art_requested", label: "Art requested" },
  { id: "art_in_progress", label: "Art in progress" },
  { id: "art_review", label: "Art in review" },
  { id: "art_done", label: "Art done" },
];
const ART_CLS: Record<string, string> = {
  needs_art: "bg-red-50 text-red-600 border-red-100",
  art_requested: "bg-amber-50 text-amber-600 border-amber-100",
  art_in_progress: "bg-blue-50 text-blue-600 border-blue-100",
  art_review: "bg-purple-50 text-purple-600 border-purple-100",
  art_done: "bg-emerald-50 text-emerald-600 border-emerald-100",
};
const ART_SHORT: Record<string, string> = {
  needs_art: "🎨", art_requested: "🎨⏳", art_in_progress: "🎨✏️", art_review: "🎨👀", art_done: "🎨✅",
};

function fmtDate(ts: number) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function isOverdue(i: any) { return i.dueDate && i.dueDate < Date.now() && i.status !== "published"; }
function relTime(ts: number) {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < -1) return `${Math.abs(days)}d overdue`;
  return `In ${days}d`;
}

export function EditorialCalendar() {
  const items = useItems("editorial");
  const members = useMembers();
  const [filterCat, setFilterCat] = useState("all");
  const [filterWriter, setFilterWriter] = useState("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [modal, setModal] = useState<"add" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [f, setF] = useState({ title: "", assignee: "", category: "organic", dueDate: "", notes: "", status: "pitch", artStatus: "none", artAssignee: "", artNotes: "", artDueDate: "" });

  // Drag & drop state
  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "0.4";
  };
  const handleDragEnd = (e: React.DragEvent) => {
    dragItem.current = null; setDragOverCol(null);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "1";
  };
  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); setDragOverCol(null);
    if (dragItem.current) {
      const item = items.find((i) => i._id === dragItem.current);
      if (item && item.status !== colId) updateStatus(dragItem.current, colId);
      dragItem.current = null;
    }
  };

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

      {/* ─── Board view with drag & drop ─── */}
      {view === "board" && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto">
          {STATUSES.map((st) => {
            const col = filtered.filter((i) => i.status === st);
            const isOver = dragOverCol === st;
            return (
              <div
                key={st}
                className={`rounded-xl border transition-all duration-150 min-w-[160px] ${
                  isOver ? "bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-200" : "bg-gray-50 border-gray-200"
                }`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(st); }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, st)}
              >
                <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[st]}`} />
                  <span className="text-[11px] font-semibold text-gray-600">{STATUS_LABEL[st]}</span>
                  <span className="ml-auto text-[11px] text-gray-400">{col.length}</span>
                </div>
                <div className={`p-1.5 space-y-1.5 min-h-[120px] transition-all ${isOver ? "min-h-[160px]" : ""}`}>
                  {col.map((i) => {
                    const cat = CATEGORIES.find((c) => c.id === i.category);
                    return (
                      <div
                        key={i._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, i._id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setEditing({ ...i, dueDateStr: i.dueDate ? new Date(i.dueDate).toISOString().split("T")[0] : "" })}
                        className={`bg-white border rounded-lg p-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition group select-none ${isOverdue(i) ? "border-red-200" : "border-gray-100"}`}
                      >
                        <div className="flex items-start gap-1">
                          <span className="text-gray-200 mt-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                            <GripVertical size={10} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 line-clamp-2 text-xs">{i.title}</div>
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {cat && <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${cat.cls}`}>{cat.label}</span>}
                              {i.artStatus && i.artStatus !== "none" && (
                                <span className={`px-1 py-0.5 rounded border text-[9px] font-medium ${ART_CLS[i.artStatus] || ""}`}>
                                  {ART_SHORT[i.artStatus] || "🎨"}
                                </span>
                              )}
                              {i.assignee && <span className="text-gray-400 text-[10px]">{i.assignee}</span>}
                            </div>
                            {i.dueDate && (
                              <div className={`text-[10px] mt-1 ${isOverdue(i) ? "text-red-500 font-medium" : "text-gray-400"}`}>
                                {relTime(i.dueDate)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isOver && col.length === 0 && (
                    <div className="border-2 border-dashed border-indigo-200 rounded-lg p-4 text-center text-xs text-indigo-400">Drop here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── List view ─── */}
      {view === "list" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-gray-400 text-xs">
              <th className="text-left px-5 py-2.5 font-medium">Article</th>
              <th className="text-left px-3 py-2.5 font-medium">Type</th>
              <th className="text-left px-3 py-2.5 font-medium">Stage</th>
              <th className="text-left px-3 py-2.5 font-medium">Writer</th>
              <th className="text-left px-3 py-2.5 font-medium">Art</th>
              <th className="text-left px-3 py-2.5 font-medium">Due</th>
              <th className="text-left px-3 py-2.5 font-medium w-8"></th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((i) => {
                const cat = CATEGORIES.find((c) => c.id === i.category);
                const overdue = isOverdue(i);
                const payCls = i.paymentStatus === "paid" ? "text-emerald-500" : i.paymentStatus === "invoiced" ? "text-amber-500" : "text-gray-300";
                return (
                  <tr key={i._id} onClick={() => setEditing({ ...i, dueDateStr: i.dueDate ? new Date(i.dueDate).toISOString().split("T")[0] : "", artDueDateStr: i.artDueDate ? new Date(i.artDueDate).toISOString().split("T")[0] : "" })}
                    className={`cursor-pointer hover:bg-gray-50 transition ${overdue ? "bg-red-50/50" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900">{i.title}</span>
                        {i.draftUrl && <a href={i.draftUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-400 hover:text-indigo-600"><ExternalLink size={11} /></a>}
                      </div>
                      {i.waitingOn && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium mt-1">
                          <ArrowRightLeft size={9} /> → {i.waitingOn}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {cat && <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cat.cls}`}>{cat.label}</span>}
                        {(i.category === "sponsored" || i.category === "collaboration") && <DollarSign size={10} className={payCls} />}
                      </div>
                    </td>
                    <td className="px-3 py-3"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[i.status]}`} /><span className="text-xs text-gray-600">{STATUS_LABEL[i.status]}</span></span></td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{i.assignee || "—"}</td>
                    <td className="px-3 py-3">
                      {i.artStatus && i.artStatus !== "none" ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium inline-flex items-center gap-0.5 ${ART_CLS[i.artStatus]}`}>
                          <Palette size={9} /> {ART_STATUSES.find(a => a.id === i.artStatus)?.label.replace("Art ", "") || i.artStatus}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className={`px-3 py-3 text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      {i.dueDate ? relTime(i.dueDate) : "—"}
                    </td>
                    <td className="px-3 py-1">
                      <button onClick={(e) => { e.stopPropagation(); setDetail(i); }} className="text-[10px] text-gray-300 hover:text-indigo-500 transition" title="Details">•••</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === "add" && <ModalForm title="New Article" onClose={() => setModal(null)} members={members} initial={f} onSave={(d: any) => { createItem({ type: "editorial", title: d.title, status: d.status, assignee: d.assignee || undefined, category: d.category, dueDate: d.dueDate ? new Date(d.dueDate).getTime() : undefined, notes: d.notes || undefined, artStatus: d.artStatus !== "none" ? d.artStatus : undefined, artAssignee: d.artAssignee || undefined, artNotes: d.artNotes || undefined, artDueDate: d.artDueDate ? new Date(d.artDueDate).getTime() : undefined }); setModal(null); }} />}
      {detail && <ItemDetailModal item={detail} onClose={() => setDetail(null)} onDelete={() => { removeItem(detail._id); setDetail(null); }} />}
      {editing && <ModalForm title="Edit Article" onClose={() => setEditing(null)} members={members} initial={{ title: editing.title, assignee: editing.assignee || "", category: editing.category || "organic", dueDate: editing.dueDateStr || "", notes: editing.notes || "", status: editing.status, artStatus: editing.artStatus || "none", artAssignee: editing.artAssignee || "", artNotes: editing.artNotes || "", artDueDate: editing.artDueDateStr || "" }} onSave={(d: any) => { updateItem(editing._id, { title: d.title, status: d.status, assignee: d.assignee || undefined, category: d.category, dueDate: d.dueDate ? new Date(d.dueDate).getTime() : undefined, notes: d.notes || undefined, artStatus: d.artStatus !== "none" ? d.artStatus : undefined, artAssignee: d.artAssignee || undefined, artNotes: d.artNotes || undefined, artDueDate: d.artDueDate ? new Date(d.artDueDate).getTime() : undefined }); setEditing(null); }} onDelete={() => { removeItem(editing._id); setEditing(null); }} />}
    </div>
  );
}

function ModalForm({ title, onClose, members, initial, onSave, onDelete }: any) {
  const [d, setD] = useState(initial);
  const [showArt, setShowArt] = useState(initial.artStatus && initial.artStatus !== "none");
  const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e: any) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="text-base font-semibold">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
        <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label><input value={d.title} onChange={(e: any) => setD({ ...d, title: e.target.value })} className={sel} autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Type</label><select value={d.category} onChange={(e: any) => setD({ ...d, category: e.target.value })} className={sel}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Stage</label><select value={d.status} onChange={(e: any) => setD({ ...d, status: e.target.value })} className={sel}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Writer</label><select value={d.assignee} onChange={(e: any) => setD({ ...d, assignee: e.target.value })} className={sel}><option value="">Unassigned</option>{members.map((m: any) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Due</label><input type="date" value={d.dueDate} onChange={(e: any) => setD({ ...d, dueDate: e.target.value })} className={sel} /></div>
        </div>
        <div><label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label><textarea value={d.notes} onChange={(e: any) => setD({ ...d, notes: e.target.value })} rows={2} className={sel + " resize-none"} /></div>
        
        {/* Art requirements section */}
        <div className="border-t border-gray-100 pt-3">
          <button type="button" onClick={() => setShowArt(!showArt)} className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition">
            <Palette size={12} />
            {showArt ? "Hide art requirements" : "Add art requirements"}
          </button>
          {showArt && (
            <div className="mt-3 space-y-3 p-3 bg-purple-50/30 rounded-lg border border-purple-100/50">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Art Status</label><select value={d.artStatus || "none"} onChange={(e: any) => setD({ ...d, artStatus: e.target.value })} className={sel}>{ART_STATUSES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select></div>
                <div><label className="text-xs font-medium text-gray-500 mb-1 block">Designer</label><select value={d.artAssignee || ""} onChange={(e: any) => setD({ ...d, artAssignee: e.target.value })} className={sel}><option value="">Unassigned</option><option value="Andres">Andres</option>{members.map((m: any) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Art Due</label><input type="date" value={d.artDueDate || ""} onChange={(e: any) => setD({ ...d, artDueDate: e.target.value })} className={sel} /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Art Notes</label><textarea value={d.artNotes || ""} onChange={(e: any) => setD({ ...d, artNotes: e.target.value })} rows={2} placeholder="Cover image specs, brand colors, reference links…" className={sel + " resize-none"} /></div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => onSave(d)} disabled={!d.title.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-medium transition">Save</button>
          {onDelete && <button onClick={onDelete} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition">Delete</button>}
        </div>
      </div>
    </div>
  );
}
