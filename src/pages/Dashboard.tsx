import { useState } from "react";
import { useStats, useOverdue, useUpcoming, useItems, removeItem } from "../store";
import type { ContentItem } from "../store";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { AlertTriangle, Calendar, BarChart3, CheckCircle, Clock, ArrowRight, ArrowRightLeft, ExternalLink, Skull, TrendingUp, TrendingDown } from "lucide-react";

const typeLabels: Record<string, string> = { twitter: "Twitter", editorial: "Editorial", ttd: "TTD", podcast: "Podcast", portfolio: "Portfolio" };
const typeDots: Record<string, string> = { twitter: "bg-sky-500", editorial: "bg-indigo-500", ttd: "bg-amber-500", podcast: "bg-pink-500", portfolio: "bg-emerald-500" };
const statusLabels: Record<string, string> = { pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit", ready: "Ready", published: "Published", planned: "Planned", booked: "Booked", recorded: "Recorded", editing: "Editing", requested: "Requested", accepted: "Accepted", in_progress: "In Progress", delivered: "Delivered" };

function relTime(ts: number) {
  const days = Math.round((ts - Date.now()) / 86400000);
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
  return "text-gray-400";
}
function staleDays(item: ContentItem) { return Math.floor((Date.now() - item.updatedAt) / 86400000); }
function isActive(i: ContentItem) { return i.status !== "published" && i.status !== "delivered"; }

type Page = "dashboard" | "board" | "calendar" | "bandwidth" | "art" | "twitter" | "editorial" | "ttd" | "podcast" | "portfolio";

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const stats = useStats();
  const overdue = useOverdue().sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  const upcoming = useUpcoming(7).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  const allItems = useItems();
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  // Stale: no movement in 5+ days, active
  const staleItems = allItems.filter((i) => isActive(i) && staleDays(i) > 5).sort((a, b) => staleDays(b) - staleDays(a)).slice(0, 6);

  // Graveyard: overdue 30+ days — kill or reschedule
  const graveyard = allItems.filter((i) => isActive(i) && i.dueDate && (Date.now() - i.dueDate) > 30 * 86400000).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  // Handoffs: items waiting on someone
  const handoffs = allItems.filter((i) => i.waitingOn && isActive(i));

  // In review (bottleneck)
  const inReview = allItems.filter((i) => i.status === "review" || i.status === "copy_edit");

  // Publication velocity: weekly buckets (last 4 weeks)
  const now = Date.now();
  const day = 86400000;
  const weeks: { label: string; count: number; types: Record<string, number> }[] = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = now - (w + 1) * 7 * day;
    const weekEnd = now - w * 7 * day;
    const published = allItems.filter((i) => (i.status === "published" || i.status === "delivered") && i.updatedAt >= weekStart && i.updatedAt < weekEnd);
    const types: Record<string, number> = {};
    published.forEach((i) => { types[i.type] = (types[i.type] || 0) + 1; });
    const label = w === 0 ? "This week" : w === 1 ? "Last week" : `${w}w ago`;
    weeks.push({ label, count: published.length, types });
  }
  const maxWeekly = Math.max(...weeks.map((w) => w.count), 1);
  const thisWeekCount = weeks[weeks.length - 1].count;
  const lastWeekCount = weeks[weeks.length - 2].count;
  const velocityDelta = thisWeekCount - lastWeekCount;

  // Paid pipeline summary
  const paidItems = allItems.filter((i) => i.category === "sponsored" || i.category === "collaboration" || (i.type === "portfolio" && i.requestType === "Paid Engagement"));
  const paidUnpaid = paidItems.filter((i) => i.paymentStatus === "unpaid" || !i.paymentStatus).length;
  const paidTotal = paidItems.reduce((sum, i) => sum + (i.dealValue || 0), 0);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Morning brief */}
      <div className="pb-4 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900">{greeting}</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {stats.overdueCount > 0
            ? `${stats.overdueCount} overdue, ${stats.dueThisWeek} due this week.${handoffs.length > 0 ? ` ${handoffs.length} item${handoffs.length > 1 ? "s" : ""} waiting on handoff.` : ""}`
            : stats.dueThisWeek > 0
              ? `${stats.dueThisWeek} due this week. Pipeline looks healthy.`
              : "All clear this week."
          }
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatPill icon={<BarChart3 size={14} />} label="Active" value={stats.totalActive} color="text-gray-700" />
        <StatPill icon={<AlertTriangle size={14} />} label="Overdue" value={stats.overdueCount} color={stats.overdueCount > 0 ? "text-red-600" : "text-gray-400"} />
        <StatPill icon={<Calendar size={14} />} label="This week" value={stats.dueThisWeek} color={stats.dueThisWeek > 0 ? "text-amber-600" : "text-gray-400"} />
        <StatPill icon={<ArrowRightLeft size={14} />} label="Handoffs" value={handoffs.length} color={handoffs.length > 0 ? "text-blue-600" : "text-gray-400"} />
        <StatPill icon={<CheckCircle size={14} />} label="Published" value={stats.publishedThisMonth} color="text-emerald-600" />
      </div>

      {/* Quick nav */}
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

      {/* Publication velocity */}
      <section className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2">
          {velocityDelta >= 0 ? <TrendingUp size={13} className="text-emerald-500" /> : <TrendingDown size={13} className="text-red-400" />}
          <span className="text-xs font-semibold text-gray-700">Publication Velocity</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${velocityDelta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {velocityDelta >= 0 ? "+" : ""}{velocityDelta} vs last week
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-end gap-3 h-20">
            {weeks.map((w, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-700">{w.count}</span>
                <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: `${Math.max((w.count / maxWeekly) * 100, 8)}%` }}>
                  {Object.entries(w.types).map(([type, count], ti) => {
                    const pct = (count / Math.max(w.count, 1)) * 100;
                    return <div key={type} className={`absolute bottom-0 left-0 right-0 rounded-t-md ${typeDots[type]?.replace("bg-", "bg-") || "bg-gray-300"} opacity-80`} style={{ height: `${pct}%`, bottom: `${Object.entries(w.types).slice(0, ti).reduce((s, [, c]) => s + (c / Math.max(w.count, 1)) * 100, 0)}%` }} />;
                  })}
                </div>
                <span className="text-[10px] text-gray-400">{w.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Overdue */}
        <ListSection title="Overdue" icon={<AlertTriangle size={13} />} iconCls="text-red-400" bg="bg-red-50/30" count={overdue.length} countCls="text-red-600 bg-red-100" items={overdue} onSelect={setSelectedItem} empty="All caught up ✓" />

        {/* Handoffs */}
        {handoffs.length > 0 ? (
          <section className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 bg-blue-50/30">
              <ArrowRightLeft size={13} className="text-blue-400" />
              <span className="text-xs font-semibold text-gray-700">Waiting on Handoff</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">{handoffs.length}</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
              {handoffs.map((item) => (
                <div key={item._id} onClick={() => setSelectedItem(item)} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 cursor-pointer transition">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDots[item.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-900 truncate flex items-center gap-1.5">
                      {item.title}
                      {item.draftUrl && <ExternalLink size={10} className="text-gray-300 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      <span className="text-blue-500 font-medium">→ {item.waitingOn}</span>
                      {item.handoffNote && <span> — {item.handoffNote}</span>}
                    </div>
                  </div>
                  {item.handoffAt && <span className="text-[10px] text-gray-300 tabular-nums shrink-0">{relTime(item.handoffAt)}</span>}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <ListSection title="This Week" icon={<Calendar size={13} />} iconCls="text-amber-400" bg="bg-amber-50/30" count={upcoming.length} countCls="text-amber-600 bg-amber-100" items={upcoming} onSelect={setSelectedItem} empty="Nothing due this week" />
        )}
      </div>

      {/* This week if handoffs took its slot */}
      {handoffs.length > 0 && upcoming.length > 0 && (
        <ListSection title="This Week" icon={<Calendar size={13} />} iconCls="text-amber-400" bg="bg-amber-50/30" count={upcoming.length} countCls="text-amber-600 bg-amber-100" items={upcoming} onSelect={setSelectedItem} empty="" />
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Stale */}
        {staleItems.length > 0 && (
          <section className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2">
              <Clock size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700">Stale</span>
              <span className="text-[10px] text-gray-400">5+ days idle</span>
            </div>
            <div className="divide-y divide-gray-50">
              {staleItems.map((item) => (
                <div key={item._id} onClick={() => setSelectedItem(item)} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 cursor-pointer transition">
                  <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"} · {statusLabels[item.status]}</div>
                  </div>
                  <span className="text-[11px] text-gray-300 tabular-nums">{staleDays(item)}d idle</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Review bottleneck */}
        {inReview.length > 0 && (
          <section className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 bg-purple-50/30">
              <ArrowRight size={13} className="text-purple-400" />
              <span className="text-xs font-semibold text-gray-700">Waiting for Review</span>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">{inReview.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {inReview.map((item) => (
                <div key={item._id} onClick={() => setSelectedItem(item)} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 cursor-pointer transition">
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

      {/* Graveyard — kill or reschedule */}
      {graveyard.length > 0 && (
        <section className="border border-red-100 rounded-xl overflow-hidden bg-red-50/10">
          <div className="px-4 py-2.5 border-b border-red-100 flex items-center gap-2 bg-red-50/40">
            <Skull size={13} className="text-red-400" />
            <span className="text-xs font-semibold text-red-700">Graveyard</span>
            <span className="text-[10px] text-red-400">30+ days overdue — kill or reschedule</span>
          </div>
          <div className="divide-y divide-red-50">
            {graveyard.map((item) => {
              const overdueDays = Math.round((Date.now() - (item.dueDate || 0)) / 86400000);
              return (
                <div key={item._id} className="px-4 py-2.5 flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-gray-700 truncate">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"} · {overdueDays}d overdue</div>
                  </div>
                  <button onClick={() => setSelectedItem(item)} className="text-[10px] text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-2 py-1 rounded font-medium transition">Reschedule</button>
                  <button onClick={() => removeItem(item._id)} className="text-[10px] text-red-500 hover:text-red-700 bg-white border border-red-200 px-2 py-1 rounded font-medium transition">Kill</button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Paid pipeline */}
      {paidItems.length > 0 && (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Paid Pipeline</span>
            <span className="text-[10px] text-gray-400">{paidItems.length} deals · ${paidTotal.toLocaleString()} total · {paidUnpaid} unpaid</span>
          </div>
          <div className="p-3 flex gap-2 flex-wrap">
            {paidItems.slice(0, 8).map((item) => {
              const pay = item.paymentStatus || "unpaid";
              const payCls = pay === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : pay === "invoiced" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-gray-50 text-gray-500 border-gray-200";
              return (
                <div key={item._id} onClick={() => setSelectedItem(item)} className="flex items-center gap-1.5 text-[11px] px-2 py-1 bg-white border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                  <span className="text-gray-700 font-medium">{item.client || item.title}</span>
                  {item.dealValue && <span className="text-gray-400">${(item.dealValue / 1000).toFixed(0)}k</span>}
                  <span className={`text-[9px] px-1 py-0.5 rounded border font-medium ${payCls}`}>{pay}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Workload */}
      <section className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-50"><span className="text-xs font-semibold text-gray-700">Writer Workload</span></div>
        <div className="p-4 flex gap-6 flex-wrap">
          {Object.entries(stats.workload).sort(([, a], [, b]) => b - a).map(([name, count]) => (
            <div key={name} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[11px] font-bold shrink-0">{name.charAt(0)}</div>
              <div>
                <div className="text-[13px] font-medium text-gray-900">{name}</div>
                <div className="text-[11px] text-gray-400">{count} active</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onDelete={() => { removeItem(selectedItem._id); setSelectedItem(null); }} />}
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

function ListSection({ title, icon, iconCls, bg, count, countCls, items, onSelect, empty }: any) {
  return (
    <section className="border border-gray-100 rounded-xl overflow-hidden">
      <div className={`px-4 py-2.5 border-b border-gray-50 flex items-center gap-2 ${bg}`}>
        <span className={iconCls}>{icon}</span>
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        {count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${countCls}`}>{count}</span>}
      </div>
      <div className="divide-y divide-gray-50 max-h-[320px] overflow-y-auto">
        {items.length === 0 ? (
          <p className="p-8 text-center text-gray-300 text-sm">{empty}</p>
        ) : items.map((item: ContentItem) => (
          <div key={item._id} onClick={() => onSelect(item)} className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-gray-50/50 cursor-pointer transition">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDots[item.type]}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-gray-900 truncate flex items-center gap-1.5">
                {item.title}
                {item.draftUrl && <ExternalLink size={10} className="text-gray-300 shrink-0" />}
              </div>
              <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"} · {statusLabels[item.status]}</div>
            </div>
            {item.dueDate && <span className={`text-[11px] tabular-nums shrink-0 ${relTimeClass(item.dueDate)}`}>{relTime(item.dueDate)}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
