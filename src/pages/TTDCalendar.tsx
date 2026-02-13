import { useState } from "react";
import { useItems, useMembers, createItem, updateItem, removeItem, updateStatus } from "../store";
import type { ContentItem } from "../store";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { Plus, X, CheckCircle, AlertTriangle, Clock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const STATUSES = ["planned", "drafting", "review", "published"] as const;
const STATUS_DOT: Record<string, string> = { planned: "bg-gray-400", drafting: "bg-amber-400", review: "bg-purple-400", published: "bg-emerald-400" };
const STATUS_LABEL: Record<string, string> = { planned: "Planned", drafting: "Drafting", review: "Review", published: "Published" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dateKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

export function TTDCalendar() {
  const items = useItems("ttd");
  const members = useMembers();
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [modal, setModal] = useState<"add" | null>(null);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = 86400000;

  // Build 14-day window for daily tracker
  const dailyDays: Date[] = [];
  for (let i = -3; i <= 10; i++) dailyDays.push(new Date(today.getTime() + i * day));

  // Weekly view
  const weekStart = new Date(today.getTime() + weekOffset * 7 * day);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // go to Sunday
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) weekDays.push(new Date(weekStart.getTime() + i * day));

  // Map items to dates
  const dateMap: Record<string, ContentItem[]> = {};
  items.forEach((item) => {
    if (!item.dueDate) return;
    const d = new Date(item.dueDate);
    const key = dateKey(d);
    if (!dateMap[key]) dateMap[key] = [];
    dateMap[key].push(item);
  });

  // Stats
  const thisWeekItems = items.filter((i) => {
    if (!i.dueDate) return false;
    const d = new Date(i.dueDate);
    return weekDays.some((wd) => sameDay(wd, d));
  });
  const published = thisWeekItems.filter((i) => i.status === "published");
  const late = thisWeekItems.filter((i) => i.dueDate && i.dueDate < Date.now() && i.status !== "published");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">{items.length} articles</p>
          <span className="text-[10px] text-gray-400">
            {published.length}/{thisWeekItems.length} published this week
            {late.length > 0 && <span className="text-red-500 ml-1">· {late.length} late</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {(["daily", "weekly"] as const).map((m) => (
              <button key={m} onClick={() => setView(m)}
                className={`px-3 py-1.5 text-xs font-medium transition ${view === m ? "bg-indigo-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
                {m === "daily" ? "Daily" : "Weekly"}
              </button>
            ))}
          </div>
          <button onClick={() => setModal("add")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* ─── Daily publishing tracker ─── */}
      {view === "daily" && (
        <div className="space-y-1">
          {dailyDays.map((date) => {
            const key = dateKey(date);
            const dayItems = dateMap[key] || [];
            const isToday = sameDay(date, today);
            const isPast = date < today && !isToday;
            const allPublished = dayItems.length > 0 && dayItems.every((i) => i.status === "published");
            const hasLate = isPast && dayItems.some((i) => i.status !== "published");
            const dayLabel = `${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()}`;

            return (
              <div key={key} className={`rounded-lg border transition ${
                isToday ? "border-indigo-200 bg-indigo-50/30" :
                hasLate ? "border-red-200 bg-red-50/20" :
                allPublished ? "border-emerald-100 bg-emerald-50/10" :
                "border-gray-100"
              }`}>
                <div className="px-4 py-2.5 flex items-center gap-3">
                  {/* Date label */}
                  <div className="w-24 shrink-0">
                    <div className={`text-xs font-semibold ${isToday ? "text-indigo-600" : "text-gray-700"}`}>
                      {isToday ? "Today" : dayLabel}
                    </div>
                    {isToday && <div className="text-[10px] text-gray-400">{dayLabel}</div>}
                  </div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {dayItems.length === 0 ? (
                      <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center"><span className="text-gray-300 text-xs">–</span></span>
                    ) : allPublished ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : hasLate ? (
                      <AlertTriangle size={18} className="text-red-400" />
                    ) : (
                      <Clock size={18} className="text-amber-400" />
                    )}
                  </div>

                  {/* Items */}
                  <div className="flex-1 flex gap-2 flex-wrap min-w-0">
                    {dayItems.length === 0 ? (
                      <span className="text-xs text-gray-300 italic">No article scheduled</span>
                    ) : dayItems.map((item) => (
                      <button key={item._id} onClick={() => setSelected(item)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer hover:shadow-sm transition ${
                          item.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-100 line-through" :
                          hasLate && item.status !== "published" ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-white text-gray-700 border-gray-200"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status]}`} />
                        <span className="truncate max-w-[200px]">{item.title}</span>
                        <span className="text-[10px] text-gray-400">· {item.assignee || "?"}</span>
                        {item.draftUrl && <ExternalLink size={10} className="text-gray-300" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Weekly view ─── */}
      {view === "weekly" && (
        <>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={16} className="text-gray-500" /></button>
            <span className="text-sm font-semibold text-gray-700 min-w-[160px] text-center">
              Week of {MONTHS[weekStart.getMonth()]} {weekStart.getDate()}
            </span>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={16} className="text-gray-500" /></button>
            {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-indigo-600 font-medium ml-1">This week</button>}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date) => {
              const key = dateKey(date);
              const dayItems = dateMap[key] || [];
              const isToday = sameDay(date, today);
              const isPast = date < today;
              const allDone = dayItems.length > 0 && dayItems.every((i) => i.status === "published");

              return (
                <div key={key} className={`rounded-xl border min-h-[140px] p-2.5 ${
                  isToday ? "border-indigo-200 bg-indigo-50/30" :
                  allDone ? "border-emerald-100" :
                  isPast && dayItems.some((i) => i.status !== "published") ? "border-red-200" :
                  "border-gray-100"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-indigo-600 text-white" : "text-gray-500"}`}>
                      {date.getDate()}
                    </span>
                    <span className="text-[10px] text-gray-400">{DAYS[date.getDay()]}</span>
                  </div>
                  <div className="space-y-1">
                    {dayItems.map((item) => (
                      <button key={item._id} onClick={() => setSelected(item)}
                        className={`w-full text-left text-[11px] p-1.5 rounded border cursor-pointer hover:shadow-sm transition ${
                          item.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-100 line-through" :
                          isPast ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-white text-gray-700 border-gray-100"
                        }`}>
                        <div className="truncate font-medium">{item.title}</div>
                        <div className="text-[10px] text-gray-400">{item.assignee}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {modal === "add" && <AddTTDModal members={members} onClose={() => setModal(null)} />}
      {selected && <ItemDetailModal item={selected} onClose={() => setSelected(null)} onDelete={() => { removeItem(selected._id); setSelected(null); }} />}
    </div>
  );
}

function AddTTDModal({ members, onClose }: { members: any[]; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="text-base font-semibold">New TTD Article</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
        <div><label className="text-xs font-medium text-gray-500 mb-1 block">Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={sel} autoFocus /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Writer</label><select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={sel}><option value="">Pick</option>{members.map((m: any) => <option key={m._id} value={m.name}>{m.name}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Due</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={sel} /></div>
        </div>
        <div><label className="text-xs font-medium text-gray-500 mb-1 block">Draft link</label><input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="https://docs.google.com/..." className={sel} /></div>
        <button onClick={() => { createItem({ type: "ttd", title, status: "planned", assignee: assignee || undefined, dueDate: dueDate ? new Date(dueDate).getTime() : undefined, draftUrl: draftUrl || undefined }); onClose(); }} disabled={!title.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-medium transition">Add</button>
      </div>
    </div>
  );
}
