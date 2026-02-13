import { useState, useRef } from "react";
import { useItems, useMembers, updateItem } from "../store";
import type { ContentItem, ArtStatus } from "../store";
import { Palette, GripVertical, ExternalLink, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const COLS: { id: ArtStatus; label: string; dot: string }[] = [
  { id: "needs_art", label: "Needs Art", dot: "bg-red-400" },
  { id: "art_requested", label: "Requested", dot: "bg-amber-400" },
  { id: "art_in_progress", label: "In Progress", dot: "bg-blue-400" },
  { id: "art_review", label: "Review", dot: "bg-purple-400" },
  { id: "art_done", label: "Done", dot: "bg-emerald-400" },
];

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  twitter: { label: "Twitter", cls: "bg-sky-50 text-sky-600 border-sky-100" },
  editorial: { label: "Editorial", cls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  ttd: { label: "TTD", cls: "bg-amber-50 text-amber-600 border-amber-100" },
  podcast: { label: "Podcast", cls: "bg-pink-50 text-pink-600 border-pink-100" },
  portfolio: { label: "Portfolio", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

const STATUS_LABEL: Record<string, string> = {
  pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review",
  copy_edit: "Copy Edit", ready: "Ready", published: "Published", planned: "Planned",
  booked: "Booked", recorded: "Recorded", editing: "Editing",
};

function relTime(ts: number) {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < -1) return `${Math.abs(days)}d overdue`;
  return `In ${days}d`;
}
function relClass(ts: number) {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days < -1) return "text-red-600 font-semibold";
  if (days < 0) return "text-red-500";
  if (days === 0) return "text-amber-600 font-medium";
  return "text-gray-400";
}

export function ArtPipeline() {
  const allItems = useItems();
  const members = useMembers();
  const [filterDesigner, setFilterDesigner] = useState("all");
  const [editing, setEditing] = useState<ContentItem | null>(null);

  // Items with art tracking
  const artItems = allItems.filter((i) => i.artStatus && i.artStatus !== "none");
  // Items that probably need art but don't have it tracked yet (sponsored/collab articles not published)
  const untracked = allItems.filter(
    (i) => i.type === "editorial"
      && (i.category === "sponsored" || i.category === "collaboration")
      && (!i.artStatus || i.artStatus === "none")
      && i.status !== "published"
  );

  const filtered = filterDesigner === "all"
    ? artItems
    : artItems.filter((i) => i.artAssignee === filterDesigner);

  const designers = [...new Set(artItems.map((i) => i.artAssignee).filter(Boolean))].sort();

  // Drag & drop
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
  const handleDrop = (e: React.DragEvent, colId: ArtStatus) => {
    e.preventDefault(); setDragOverCol(null);
    if (dragItem.current) {
      const item = artItems.find((i) => i._id === dragItem.current);
      if (item && item.artStatus !== colId) {
        updateItem(dragItem.current, { artStatus: colId });
      }
      dragItem.current = null;
    }
  };

  // Stats
  const needsCount = filtered.filter((i) => i.artStatus === "needs_art").length;
  const inFlightCount = filtered.filter((i) => i.artStatus === "art_requested" || i.artStatus === "art_in_progress").length;
  const reviewCount = filtered.filter((i) => i.artStatus === "art_review").length;
  const doneCount = filtered.filter((i) => i.artStatus === "art_done").length;
  const overdueArt = filtered.filter((i) => i.artDueDate && i.artDueDate < Date.now() && i.artStatus !== "art_done");

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <Stat icon={<AlertTriangle size={12} />} label="Needs art" value={needsCount} cls={needsCount > 0 ? "text-red-600" : "text-gray-400"} />
          <Stat icon={<Clock size={12} />} label="In flight" value={inFlightCount} cls="text-blue-600" />
          <Stat icon={<Palette size={12} />} label="Review" value={reviewCount} cls={reviewCount > 0 ? "text-purple-600" : "text-gray-400"} />
          <Stat icon={<CheckCircle size={12} />} label="Done" value={doneCount} cls="text-emerald-600" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select value={filterDesigner} onChange={(e) => setFilterDesigner(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="all">All designers</option>
            {designers.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {overdueArt.length > 0 && (
            <span className="text-[11px] text-red-600 font-medium bg-red-50 px-2 py-1 rounded-lg border border-red-100">
              {overdueArt.length} art overdue
            </span>
          )}
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 items-start">
        {COLS.map((col) => {
          const colItems = filtered.filter((i) => i.artStatus === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={`rounded-xl border transition-all duration-150 ${
                isOver ? "bg-purple-50/60 border-purple-200 ring-1 ring-purple-200" : "bg-gray-50/80 border-gray-100"
              }`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-[11px] font-semibold text-gray-600">{col.label}</span>
                <span className="ml-auto text-[11px] text-gray-400">{colItems.length}</span>
              </div>
              <div className={`p-1.5 space-y-1.5 min-h-[180px] transition-all ${isOver ? "min-h-[220px]" : ""}`}>
                {colItems.map((item) => {
                  const badge = TYPE_BADGE[item.type];
                  const artOverdue = item.artDueDate && item.artDueDate < Date.now() && item.artStatus !== "art_done";
                  return (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item._id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setEditing(item)}
                      className={`bg-white border rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition group select-none ${
                        artOverdue ? "border-red-200" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-1">
                        <span className="text-gray-200 mt-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <GripVertical size={10} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-gray-900 leading-snug">{item.title}</div>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            {badge && (
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {STATUS_LABEL[item.status] || item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {item.artAssignee && (
                              <span className="text-[10px] text-purple-500 font-medium">{item.artAssignee}</span>
                            )}
                            {item.artDueDate && (
                              <span className={`text-[10px] ${artOverdue ? relClass(item.artDueDate) : "text-gray-400"}`}>
                                {relTime(item.artDueDate)}
                              </span>
                            )}
                          </div>
                          {item.artNotes && (
                            <div className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{item.artNotes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isOver && colItems.length === 0 && (
                  <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center text-xs text-purple-400">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Untracked sponsored/collab items */}
      {untracked.length > 0 && (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 bg-amber-50/30 flex items-center gap-2">
            <Palette size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">Likely needs art</span>
            <span className="text-[10px] text-gray-400">Sponsored / collab articles without art status</span>
            <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{untracked.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {untracked.map((item) => (
              <div key={item._id} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 transition">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-900">{item.title}</div>
                  <div className="text-[10px] text-gray-400">{item.assignee || "Unassigned"} · {item.category}</div>
                </div>
                <button
                  onClick={() => updateItem(item._id, { artStatus: "needs_art" })}
                  className="text-[10px] text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-lg border border-purple-100 font-medium transition whitespace-nowrap"
                >
                  + Add to art pipeline
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edit modal */}
      {editing && (
        <ArtEditModal
          item={editing}
          members={members}
          onClose={() => setEditing(null)}
          onSave={(updates) => { updateItem(editing._id, updates); setEditing(null); }}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value, cls }: { icon: React.ReactNode; label: string; value: number; cls: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cls}>{icon}</span>
      <span className={`text-sm font-bold ${cls}`}>{value}</span>
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  );
}

function ArtEditModal({ item, members, onClose, onSave }: {
  item: ContentItem;
  members: any[];
  onClose: () => void;
  onSave: (updates: Partial<ContentItem>) => void;
}) {
  const [artStatus, setArtStatus] = useState(item.artStatus || "needs_art");
  const [artAssignee, setArtAssignee] = useState(item.artAssignee || "");
  const [artNotes, setArtNotes] = useState(item.artNotes || "");
  const [artDueDate, setArtDueDate] = useState(item.artDueDate ? new Date(item.artDueDate).toISOString().split("T")[0] : "");

  const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[11px] text-gray-400">{item.assignee || "Unassigned"}</span>
            <span className="text-gray-300">·</span>
            <span className="text-[11px] text-gray-400">{STATUS_LABEL[item.status] || item.status}</span>
            {item.dueDate && (
              <>
                <span className="text-gray-300">·</span>
                <span className={`text-[11px] ${relClass(item.dueDate)}`}>{relTime(item.dueDate)}</span>
              </>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600">
            <Palette size={13} /> Art Requirements
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
              <select value={artStatus} onChange={(e) => setArtStatus(e.target.value as ArtStatus)} className={sel}>
                <option value="needs_art">Needs art</option>
                <option value="art_requested">Requested</option>
                <option value="art_in_progress">In progress</option>
                <option value="art_review">Review</option>
                <option value="art_done">Done</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Designer</label>
              <select value={artAssignee} onChange={(e) => setArtAssignee(e.target.value)} className={sel}>
                <option value="">Unassigned</option>
                <option value="Andres">Andres</option>
                {members.map((m: any) => <option key={m._id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Art due date</label>
            <input type="date" value={artDueDate} onChange={(e) => setArtDueDate(e.target.value)} className={sel} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Notes</label>
            <textarea value={artNotes} onChange={(e) => setArtNotes(e.target.value)} rows={3} placeholder="Cover image specs, brand kit, reference links, deliverables…" className={sel + " resize-none"} />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSave({
              artStatus: artStatus as ArtStatus,
              artAssignee: artAssignee || undefined,
              artNotes: artNotes || undefined,
              artDueDate: artDueDate ? new Date(artDueDate).getTime() : undefined,
            })}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            Save
          </button>
          <button onClick={onClose} className="px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 py-2 rounded-lg text-sm font-medium transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
