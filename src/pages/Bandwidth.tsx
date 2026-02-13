import { useItems, useMembers } from "../store";
import type { ContentItem } from "../store";
import { AlertTriangle, CheckCircle, Clock, Palette } from "lucide-react";

const TYPE_DOT: Record<string, string> = {
  twitter: "bg-sky-500", editorial: "bg-indigo-500", ttd: "bg-amber-500", podcast: "bg-pink-500", portfolio: "bg-emerald-500",
};
const TYPE_LABEL: Record<string, string> = {
  twitter: "Twitter", editorial: "Editorial", ttd: "TTD", podcast: "Podcast", portfolio: "Portfolio",
};
const STATUS_LABEL: Record<string, string> = {
  pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit",
  ready: "Ready", published: "Published", planned: "Planned", booked: "Booked", recorded: "Recorded",
  editing: "Editing", requested: "Requested", accepted: "Accepted", in_progress: "In Progress", delivered: "Delivered",
};
const ART_LABEL: Record<string, string> = {
  needs_art: "Needs art", art_requested: "Requested", art_in_progress: "In progress", art_review: "Review", art_done: "Done",
};
const ART_CLS: Record<string, string> = {
  needs_art: "bg-red-50 text-red-600 border-red-100",
  art_requested: "bg-amber-50 text-amber-600 border-amber-100",
  art_in_progress: "bg-blue-50 text-blue-600 border-blue-100",
  art_review: "bg-purple-50 text-purple-600 border-purple-100",
  art_done: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

const CAPACITY_THRESHOLD = 6; // items — above this is "heavy"

function isActive(i: ContentItem) {
  return i.status !== "published" && i.status !== "delivered";
}
function isOverdue(i: ContentItem) {
  return i.dueDate != null && i.dueDate < Date.now() && isActive(i);
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

export function Bandwidth() {
  const allItems = useItems();
  const members = useMembers();

  const active = allItems.filter(isActive);

  // Build per-person stats
  const people = members
    .map((m) => {
      const myItems = active.filter((i) => i.assignee === m.name);
      const overdue = myItems.filter(isOverdue);
      const byType: Record<string, number> = {};
      myItems.forEach((i) => { byType[i.type] = (byType[i.type] || 0) + 1; });
      const artItems = myItems.filter((i) => i.artStatus && i.artStatus !== "none" && i.artStatus !== "art_done");
      return { ...m, items: myItems, overdue, byType, artItems, total: myItems.length };
    })
    .sort((a, b) => b.total - a.total);

  // Unassigned
  const unassigned = active.filter((i) => !i.assignee);

  // Art pipeline summary
  const artNeeded = allItems.filter((i) => i.artStatus === "needs_art" && isActive(i));
  const artInFlight = allItems.filter((i) => (i.artStatus === "art_requested" || i.artStatus === "art_in_progress" || i.artStatus === "art_review") && isActive(i));
  const artDone = allItems.filter((i) => i.artStatus === "art_done");

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="flex gap-3 flex-wrap">
        <MiniStat label="Total active" value={active.length} />
        <MiniStat label="Unassigned" value={unassigned.length} alert={unassigned.length > 0} />
        <MiniStat label="Art needed" value={artNeeded.length} alert={artNeeded.length > 0} icon={<Palette size={12} />} />
        <MiniStat label="Art in flight" value={artInFlight.length} icon={<Palette size={12} />} />
      </div>

      {/* Per-person cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {people.map((person) => {
          const load = person.total / CAPACITY_THRESHOLD;
          const barWidth = Math.min(load * 100, 100);
          const barColor = person.overdue.length > 0 ? "bg-red-500" : load > 1 ? "bg-amber-500" : load > 0.6 ? "bg-blue-500" : "bg-emerald-500";
          const loadLabel = load > 1 ? "Heavy" : load > 0.6 ? "Moderate" : load > 0 ? "Light" : "Free";
          const loadCls = load > 1 ? "text-red-600" : load > 0.6 ? "text-amber-600" : load > 0 ? "text-emerald-600" : "text-gray-400";

          return (
            <div key={person._id} className="border border-gray-100 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: person.avatarColor || "#6b7280" }}
                >
                  {person.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{person.name}</span>
                    <span className={`text-[10px] font-semibold ${loadCls}`}>{loadLabel}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">{person.role}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-gray-900">{person.total}</div>
                  <div className="text-[10px] text-gray-400">active</div>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="px-4 py-2 bg-gray-50/40">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${barWidth}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 shrink-0">
                    {person.overdue.length > 0 && (
                      <span className="flex items-center gap-0.5 text-red-600 font-medium">
                        <AlertTriangle size={10} /> {person.overdue.length} overdue
                      </span>
                    )}
                    {/* Type breakdown */}
                    {Object.entries(person.byType).map(([type, count]) => (
                      <span key={type} className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[type]}`} />
                        {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Item list */}
              {person.total > 0 && (
                <div className="divide-y divide-gray-50 max-h-[240px] overflow-y-auto">
                  {person.items
                    .sort((a, b) => {
                      if (isOverdue(a) && !isOverdue(b)) return -1;
                      if (!isOverdue(a) && isOverdue(b)) return 1;
                      return (a.dueDate || Infinity) - (b.dueDate || Infinity);
                    })
                    .map((item) => (
                      <div key={item._id} className={`px-4 py-2 flex items-center gap-2 ${isOverdue(item) ? "bg-red-50/40" : ""}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[item.type]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-gray-900 truncate">{item.title}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400">{STATUS_LABEL[item.status] || item.status}</span>
                            {item.artStatus && item.artStatus !== "none" && (
                              <span className={`text-[9px] px-1 py-0.5 rounded border font-medium inline-flex items-center gap-0.5 ${ART_CLS[item.artStatus] || "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                <Palette size={8} /> {ART_LABEL[item.artStatus] || item.artStatus}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.dueDate && (
                          <span className={`text-[10px] tabular-nums shrink-0 ${relClass(item.dueDate)}`}>
                            {relTime(item.dueDate)}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
              {person.total === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-300">No active items</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unassigned items */}
      {unassigned.length > 0 && (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 bg-amber-50/30 flex items-center gap-2">
            <Clock size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">Unassigned</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{unassigned.length}</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[200px] overflow-y-auto">
            {unassigned.map((item) => (
              <div key={item._id} className="px-4 py-2 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-gray-900 truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-400">{TYPE_LABEL[item.type]}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Art pipeline */}
      <section className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2">
          <Palette size={13} className="text-purple-500" />
          <span className="text-xs font-semibold text-gray-700">Art Pipeline</span>
          <span className="text-xs text-gray-400 ml-1">
            {artNeeded.length} needed · {artInFlight.length} in flight · {artDone.length} done
          </span>
        </div>
        <div className="p-3">
          {artNeeded.length === 0 && artInFlight.length === 0 ? (
            <p className="text-center text-xs text-gray-300 py-4">No art requirements tracked yet. Add art status to any content item to see it here.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(["needs_art", "art_requested", "art_in_progress", "art_review"] as const).map((status) => {
                const items = allItems.filter((i) => i.artStatus === status && isActive(i));
                return (
                  <div key={status} className="bg-gray-50/60 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${ART_CLS[status]}`}>
                        {ART_LABEL[status]}
                      </span>
                      <span className="text-[11px] text-gray-400 ml-auto">{items.length}</span>
                    </div>
                    <div className="space-y-1">
                      {items.map((i) => (
                        <div key={i._id} className="text-[11px] text-gray-700 truncate">
                          {i.title}
                          {i.artAssignee && <span className="text-gray-400 ml-1">· {i.artAssignee}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, alert, icon }: { label: string; value: number; alert?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${alert ? "bg-amber-50/50 border-amber-100" : "bg-gray-50/50 border-gray-100"}`}>
      {icon && <span className={alert ? "text-amber-500" : "text-gray-400"}>{icon}</span>}
      <span className={`text-sm font-bold ${alert ? "text-amber-600" : "text-gray-900"}`}>{value}</span>
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  );
}
