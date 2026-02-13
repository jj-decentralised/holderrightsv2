import { useState, useRef } from "react";
import { useItems, updateStatus } from "../store";
import { GripVertical } from "lucide-react";

/* Unified status columns — maps every content type into a shared pipeline */
const COLS = [
  { id: "pitch", label: "Pitch", aliases: ["pitch", "planned", "requested"], dot: "bg-gray-400" },
  { id: "assigned", label: "Assigned", aliases: ["assigned", "accepted", "booked"], dot: "bg-blue-400" },
  { id: "drafting", label: "In Progress", aliases: ["drafting", "in_progress", "recorded"], dot: "bg-amber-400" },
  { id: "review", label: "Review", aliases: ["review", "copy_edit", "editing"], dot: "bg-purple-400" },
  { id: "ready", label: "Ready", aliases: ["ready"], dot: "bg-teal-400" },
  { id: "published", label: "Done", aliases: ["published", "delivered"], dot: "bg-emerald-400" },
];

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  twitter: { label: "Twitter", cls: "bg-sky-50 text-sky-600 border-sky-100" },
  editorial: { label: "Editorial", cls: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  ttd: { label: "TTD", cls: "bg-amber-50 text-amber-600 border-amber-100" },
  podcast: { label: "Podcast", cls: "bg-pink-50 text-pink-600 border-pink-100" },
  portfolio: { label: "Portfolio", cls: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

function colForStatus(status: string): string {
  for (const col of COLS) {
    if (col.aliases.includes(status)) return col.id;
  }
  return "pitch";
}

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
  if (days < -3) return "text-red-600 font-semibold";
  if (days < 0) return "text-red-500";
  if (days === 0) return "text-amber-600 font-medium";
  return "text-gray-400";
}

export function BoardView() {
  const allItems = useItems();
  const [filterType, setFilterType] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");

  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const filtered = allItems.filter((i) => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (filterAssignee !== "all" && i.assignee !== filterAssignee) return false;
    return true;
  });

  const assignees = [...new Set(allItems.map((i) => i.assignee).filter(Boolean))].sort();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "0.4";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    dragItem.current = null;
    setDragOverCol(null);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "1";
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragItem.current) return;
    const item = allItems.find((i) => i._id === dragItem.current);
    if (!item) return;

    // Map the unified column back to the item's actual status
    const statusMap: Record<string, Record<string, string>> = {
      pitch: { twitter: "pitch", editorial: "pitch", ttd: "planned", podcast: "planned", portfolio: "requested" },
      assigned: { twitter: "drafting", editorial: "assigned", ttd: "planned", podcast: "booked", portfolio: "accepted" },
      drafting: { twitter: "drafting", editorial: "drafting", ttd: "drafting", podcast: "recorded", portfolio: "in_progress" },
      review: { twitter: "review", editorial: "review", ttd: "drafting", podcast: "editing", portfolio: "in_progress" },
      ready: { twitter: "review", editorial: "ready", ttd: "published", podcast: "editing", portfolio: "delivered" },
      published: { twitter: "published", editorial: "published", ttd: "published", podcast: "published", portfolio: "delivered" },
    };

    const newStatus = statusMap[colId]?.[item.type] || colId;
    if (newStatus !== item.status) {
      updateStatus(item._id, newStatus);
    }
    dragItem.current = null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="all">All types</option>
          {Object.entries(TYPE_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="all">All assignees</option>
          {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} items · Drag cards to move</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-start">
        {COLS.map((col) => {
          const colItems = filtered.filter((i) => colForStatus(i.status) === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={`rounded-xl border transition-all duration-150 ${
                isOver ? "bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-200" : "bg-gray-50/80 border-gray-100"
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
              <div className={`p-1.5 space-y-1.5 min-h-[200px] transition-all ${isOver ? "min-h-[240px]" : ""}`}>
                {colItems.map((item) => {
                  const badge = TYPE_BADGE[item.type];
                  return (
                    <div
                      key={item._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item._id)}
                      onDragEnd={handleDragEnd}
                      className="bg-white border border-gray-100 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition group select-none"
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
                            {item.assignee && <span className="text-[10px] text-gray-400">{item.assignee}</span>}
                          </div>
                          {item.dueDate && item.status !== "published" && item.status !== "delivered" && (
                            <div className={`text-[10px] mt-1 ${relClass(item.dueDate)}`}>
                              {relTime(item.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isOver && colItems.length === 0 && (
                  <div className="border-2 border-dashed border-indigo-200 rounded-lg p-6 text-center text-xs text-indigo-400">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
