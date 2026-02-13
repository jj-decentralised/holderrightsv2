import { useStats, useOverdue, useUpcoming, useItems } from "../store";
import { AlertTriangle, Calendar, BarChart3, CheckCircle, Clock, ArrowRight } from "lucide-react";

const typeLabels: Record<string, string> = { twitter: "Twitter", editorial: "Editorial", ttd: "TTD", podcast: "Podcast", portfolio: "Portfolio" };
const typeDots: Record<string, string> = { twitter: "bg-sky-500", editorial: "bg-indigo-500", ttd: "bg-amber-500", podcast: "bg-pink-500", portfolio: "bg-emerald-500" };
const statusLabels: Record<string, string> = { pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit", ready: "Ready", published: "Published", planned: "Planned", booked: "Booked", recorded: "Recorded", editing: "Editing", requested: "Requested", accepted: "Accepted", in_progress: "In Progress", delivered: "Delivered" };

function relTime(ts: number) {
  const diff = ts - Date.now();
  const days = Math.round(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days < -1) return `${Math.abs(days)}d overdue`;
  return `In ${days}d`;
}

function relTimeClass(ts: number) {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days < -3) return "text-red-600 font-semibold";
  if (days < 0) return "text-red-500 font-medium";
  if (days === 0) return "text-amber-600 font-medium";
  if (days <= 2) return "text-amber-500";
  return "text-gray-400";
}

function staleDays(item: any) {
  return Math.floor((Date.now() - item.updatedAt) / 86400000);
}

type Page = "dashboard" | "twitter" | "editorial" | "ttd" | "podcast" | "portfolio";

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const stats = useStats();
  const overdue = useOverdue().sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  const upcoming = useUpcoming(7).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  const allItems = useItems();
  
  // Items stuck in a stage for >5 days
  const staleItems = allItems
    .filter((i) => i.status !== "published" && i.status !== "delivered" && staleDays(i) > 5)
    .sort((a, b) => staleDays(b) - staleDays(a))
    .slice(0, 5);

  // Items in review (bottleneck for Joel)
  const inReview = allItems.filter((i) => i.status === "review" || i.status === "copy_edit");

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Morning brief */}
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">{greeting}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {stats.overdueCount > 0 
            ? `${stats.overdueCount} overdue item${stats.overdueCount > 1 ? "s" : ""} need attention. ${stats.dueThisWeek} due this week.`
            : stats.dueThisWeek > 0 
              ? `${stats.dueThisWeek} item${stats.dueThisWeek > 1 ? "s" : ""} due this week. Pipeline looks healthy.`
              : "All clear this week."
          }
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <StatPill icon={<BarChart3 size={14} />} label="Active" value={stats.totalActive} color="text-gray-700" />
        <StatPill icon={<AlertTriangle size={14} />} label="Overdue" value={stats.overdueCount} color={stats.overdueCount > 0 ? "text-red-600" : "text-gray-400"} />
        <StatPill icon={<Calendar size={14} />} label="This week" value={stats.dueThisWeek} color={stats.dueThisWeek > 0 ? "text-amber-600" : "text-gray-400"} />
        <StatPill icon={<CheckCircle size={14} />} label="Published" value={stats.publishedThisMonth} color="text-emerald-600" />
      </div>

      {/* Quick nav to sections */}
      <div className="flex gap-2 flex-wrap">
        {(["twitter", "editorial", "ttd", "podcast", "portfolio"] as const).map((t) => {
          const count = stats.byType[t] || 0;
          return (
            <button key={t} onClick={() => onNavigate(t)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full transition text-xs group">
              <span className={`w-1.5 h-1.5 rounded-full ${typeDots[t]}`} />
              <span className="text-gray-500 group-hover:text-gray-700">{typeLabels[t]}</span>
              <span className="text-gray-900 font-semibold">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Overdue */}
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 bg-red-50/30">
            <AlertTriangle size={13} className="text-red-400" />
            <span className="text-xs font-semibold text-gray-700">Overdue</span>
            {overdue.length > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">{overdue.length}</span>}
          </div>
          <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
            {overdue.length === 0 ? (
              <p className="p-8 text-center text-gray-300 text-sm">All caught up ✓</p>
            ) : overdue.map((item) => (
              <div key={item._id} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 transition">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDots[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-900 truncate">{item.title}</div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span>{item.assignee || "Unassigned"}</span>
                    <span>·</span>
                    <span className="text-gray-300">{statusLabels[item.status] || item.status}</span>
                  </div>
                </div>
                <span className={`text-[11px] tabular-nums shrink-0 ${relTimeClass(item.dueDate!)}`}>
                  {relTime(item.dueDate!)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* This week */}
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 bg-amber-50/30">
            <Calendar size={13} className="text-amber-400" />
            <span className="text-xs font-semibold text-gray-700">This Week</span>
            {upcoming.length > 0 && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{upcoming.length}</span>}
          </div>
          <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
            {upcoming.length === 0 ? (
              <p className="p-8 text-center text-gray-300 text-sm">Nothing due this week</p>
            ) : upcoming.map((item) => (
              <div key={item._id} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 transition">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDots[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-gray-900 truncate">{item.title}</div>
                  <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"}</div>
                </div>
                <span className={`text-[11px] tabular-nums shrink-0 ${relTimeClass(item.dueDate!)}`}>
                  {relTime(item.dueDate!)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Stale items + Review bottleneck */}
      <div className="grid lg:grid-cols-2 gap-5">
        {staleItems.length > 0 && (
          <section className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2">
              <Clock size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Stale</span>
              <span className="text-[10px] text-gray-400">No movement in 5+ days</span>
            </div>
            <div className="divide-y divide-gray-50">
              {staleItems.map((item) => (
                <div key={item._id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"} · {statusLabels[item.status] || item.status}</div>
                  </div>
                  <span className="text-[11px] text-gray-300 tabular-nums">{staleDays(item)}d idle</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {inReview.length > 0 && (
          <section className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 bg-purple-50/30">
              <ArrowRight size={13} className="text-purple-400" />
              <span className="text-xs font-semibold text-gray-700">Waiting for Review</span>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">{inReview.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {inReview.map((item) => (
                <div key={item._id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"}</div>
                  </div>
                  <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded font-medium">{statusLabels[item.status]}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Workload */}
      <section className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-50">
          <span className="text-xs font-semibold text-gray-700">Writer Workload</span>
        </div>
        <div className="p-4">
          <div className="flex gap-6 flex-wrap">
            {Object.entries(stats.workload).sort(([, a], [, b]) => b - a).map(([name, count]) => (
              <div key={name} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[11px] font-bold shrink-0">
                  {name.charAt(0)}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-gray-900">{name}</div>
                  <div className="text-[11px] text-gray-400">{count} active</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50/60 rounded-lg border border-gray-100">
      <span className={`${color} opacity-60`}>{icon}</span>
      <div>
        <div className={`text-lg font-bold ${color} leading-none`}>{value}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}
