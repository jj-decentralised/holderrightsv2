import { useState } from "react";
import { useItems } from "../store";
import { ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_BADGE: Record<string, { label: string; dot: string; cls: string }> = {
  twitter: { label: "TW", dot: "bg-sky-500", cls: "bg-sky-50 text-sky-700 border-sky-100" },
  editorial: { label: "ED", dot: "bg-indigo-500", cls: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  ttd: { label: "TTD", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700 border-amber-100" },
  podcast: { label: "POD", dot: "bg-pink-500", cls: "bg-pink-50 text-pink-700 border-pink-100" },
  portfolio: { label: "PF", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

const STATUS_DOT: Record<string, string> = {
  pitch: "bg-gray-400", assigned: "bg-blue-400", drafting: "bg-amber-400",
  review: "bg-purple-400", copy_edit: "bg-pink-400", ready: "bg-teal-400",
  published: "bg-emerald-400", planned: "bg-gray-400", booked: "bg-blue-400",
  recorded: "bg-amber-400", editing: "bg-purple-400", requested: "bg-gray-400",
  accepted: "bg-blue-400", in_progress: "bg-amber-400", delivered: "bg-emerald-400",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarView() {
  const allItems = useItems();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [filterType, setFilterType] = useState("all");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = allItems.filter((i) => {
    if (!i.dueDate) return false;
    if (filterType !== "all" && i.type !== filterType) return false;
    return true;
  });

  // Build date → items map
  const dateMap: Record<string, typeof filtered> = {};
  filtered.forEach((item) => {
    const d = new Date(item.dueDate!);
    const key = dateKey(d);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(item);
  });

  // Calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) currentWeek.push(null);
  for (let d = 1; d <= totalDays; d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const goToday = () => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Items without a due date
  const unscheduled = allItems.filter((i) => {
    if (i.dueDate) return false;
    if (filterType !== "all" && i.type !== filterType) return false;
    if (i.status === "published" || i.status === "delivered") return false;
    return true;
  });

  // Selected day items
  const selectedItems = selectedDay ? (dateMap[dateKey(selectedDay)] || []) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 min-w-[160px] text-center">{monthLabel}</h3>
          <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
          <button onClick={goToday} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-1">
            Today
          </button>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option value="all">All types</option>
            {Object.entries(TYPE_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="text-xs text-gray-400">{filtered.length} scheduled</span>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50/60 border-b border-gray-100">
              {DAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-[11px] font-semibold text-gray-400 text-center">{d}</div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-gray-50 last:border-b-0">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="min-h-[90px] bg-gray-50/30" />;
                  const key = dateKey(day);
                  const dayItems = dateMap[key] || [];
                  const isToday = sameDay(day, today);
                  const isSelected = selectedDay && sameDay(day, selectedDay);
                  const isPast = day < today && !isToday;
                  const hasOverdue = dayItems.some((i) => i.status !== "published" && i.status !== "delivered" && day < today);

                  return (
                    <div
                      key={di}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[90px] p-1.5 cursor-pointer transition border-r border-gray-50 last:border-r-0 ${
                        isSelected ? "bg-indigo-50/50 ring-1 ring-inset ring-indigo-200" :
                        isToday ? "bg-amber-50/30" :
                        isPast ? "bg-gray-50/20" :
                        "hover:bg-gray-50/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? "bg-indigo-600 text-white" : "text-gray-500"
                        }`}>
                          {day.getDate()}
                        </span>
                        {dayItems.length > 0 && (
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                            hasOverdue ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                          }`}>
                            {dayItems.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayItems.slice(0, 3).map((item) => {
                          const badge = TYPE_BADGE[item.type];
                          const done = item.status === "published" || item.status === "delivered";
                          return (
                            <div
                              key={item._id}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate border ${
                                done ? "bg-gray-50 text-gray-400 border-gray-100 line-through" :
                                hasOverdue && isPast ? "bg-red-50 text-red-700 border-red-100" :
                                badge ? badge.cls : "bg-gray-50 text-gray-600 border-gray-100"
                              }`}
                            >
                              {item.title}
                            </div>
                          );
                        })}
                        {dayItems.length > 3 && (
                          <div className="text-[9px] text-gray-400 px-1.5">+{dayItems.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel — selected day or unscheduled */}
        <div className="w-64 shrink-0 hidden lg:block">
          {selectedDay && selectedItems.length > 0 ? (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-50 bg-gray-50/60">
                <span className="text-xs font-semibold text-gray-700">
                  {selectedDay.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="text-xs text-gray-400 ml-1.5">· {selectedItems.length} items</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {selectedItems.map((item) => {
                  const badge = TYPE_BADGE[item.type];
                  const dot = STATUS_DOT[item.status] || "bg-gray-400";
                  const done = item.status === "published" || item.status === "delivered";
                  return (
                    <div key={item._id} className="px-3 py-2.5">
                      <div className={`text-[12px] font-medium ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        {item.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {badge && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className="text-[10px] text-gray-400">{item.assignee || "Unassigned"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-50 bg-gray-50/60">
                <span className="text-xs font-semibold text-gray-700">Unscheduled</span>
                <span className="text-xs text-gray-400 ml-1.5">· {unscheduled.length} items</span>
              </div>
              <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                {unscheduled.length === 0 ? (
                  <p className="p-4 text-center text-xs text-gray-300">Everything has a date</p>
                ) : unscheduled.map((item) => {
                  const badge = TYPE_BADGE[item.type];
                  return (
                    <div key={item._id} className="px-3 py-2.5">
                      <div className="text-[12px] font-medium text-gray-900">{item.title}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {badge && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border uppercase ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{item.assignee || "Unassigned"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
