import { useStats, useOverdue, useUpcoming } from "../store";
import { AlertTriangle, Calendar, BarChart3, CheckCircle } from "lucide-react";

const typeLabels: Record<string, string> = { twitter: "Twitter", editorial: "Editorial", ttd: "TokenDispatch", podcast: "Podcast", portfolio: "Portfolio" };
const typeDots: Record<string, string> = { twitter: "bg-sky-500", editorial: "bg-indigo-500", ttd: "bg-amber-500", podcast: "bg-pink-500", portfolio: "bg-emerald-500" };

function daysOverdue(d: number) { return Math.floor((Date.now() - d) / 86400000); }
function fmtDate(ts: number) { return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

type Page = "dashboard" | "twitter" | "editorial" | "ttd" | "podcast" | "portfolio";

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const stats = useStats();
  const overdue = useOverdue().sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
  const upcoming = useUpcoming(7).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<BarChart3 size={18} />} label="In Pipeline" value={stats.totalActive} accent="text-indigo-600 bg-indigo-50" />
        <Stat icon={<AlertTriangle size={18} />} label="Overdue" value={stats.overdueCount} accent="text-red-600 bg-red-50" />
        <Stat icon={<Calendar size={18} />} label="Due This Week" value={stats.dueThisWeek} accent="text-amber-600 bg-amber-50" />
        <Stat icon={<CheckCircle size={18} />} label="Published (Month)" value={stats.publishedThisMonth} accent="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(["twitter", "editorial", "ttd", "podcast", "portfolio"] as const).map((t) => (
          <button key={t} onClick={() => onNavigate(t)} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition group">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${typeDots[t]}`} />
              <span className="text-xs font-medium text-gray-500">{typeLabels[t]}</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">{stats.byType[t] || 0}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500" />
            <h3 className="text-sm font-semibold text-gray-900">Overdue · {overdue.length}</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
            {overdue.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">All caught up</p> : overdue.map((item) => (
              <div key={item._id} className="px-5 py-3 flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.assignee || "Unassigned"}</div>
                </div>
                <span className="text-xs font-medium text-red-600 tabular-nums">{daysOverdue(item.dueDate!)}d</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Calendar size={14} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">This Week · {upcoming.length}</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
            {upcoming.length === 0 ? <p className="p-6 text-center text-gray-400 text-sm">Nothing due this week</p> : upcoming.map((item) => (
              <div key={item._id} className="px-5 py-3 flex items-center gap-3">
                <span className={`w-1.5 h-1.5 rounded-full ${typeDots[item.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.assignee || "Unassigned"}</div>
                </div>
                <span className="text-xs text-gray-500 tabular-nums">{fmtDate(item.dueDate!)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Writer Workload</h3></div>
        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(stats.workload).sort(([, a], [, b]) => b - a).map(([name, count]) => (
              <div key={name} className="text-center">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center mx-auto text-xs font-bold">{name.charAt(0)}</div>
                <div className="text-sm font-medium text-gray-900 mt-1.5">{name}</div>
                <div className="text-lg font-bold text-indigo-600">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  const [text, bg] = accent.split(" ");
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} ${text} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
