import { useState } from "react";
import { useCheckins, useCheckinsByDate, useCheckinDates, useItems } from "../store";
import type { Checkin, ContentItem } from "../store";
import {
  Radio,
  Clock,
  User,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";

const confidenceColors: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

const sourceLabels: Record<string, string> = {
  slack_scan: "Slack scan",
  direct_ping: "Direct ping",
  manual: "Manual",
};

function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${ampm}`;
}

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeDate(d: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Today";
  if (d === yesterday) return "Yesterday";
  return formatDate(d);
}

export function DailyCheckins() {
  const dates = useCheckinDates();
  const allCheckins = useCheckins();
  const allItems = useItems();
  const [selectedDate, setSelectedDate] = useState<string>(
    dates[0] || new Date().toISOString().slice(0, 10)
  );
  const [expandedHour, setExpandedHour] = useState<number | null>(null);
  const dayCheckins = useCheckinsByDate(selectedDate);

  // Build daily summary
  const uniquePeople = new Set<string>();
  let totalUpdates = 0;
  let totalPings = 0;
  dayCheckins.forEach((c) => {
    c.entries.forEach((e) => uniquePeople.add(e.person));
    totalUpdates += c.hub_updates.length;
    totalPings += c.pings_sent.length;
  });

  // Find item titles for hub updates
  const itemMap = new Map<string, ContentItem>();
  allItems.forEach((i) => itemMap.set(i._id, i));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Radio size={18} className="text-indigo-500" />
            Daily Check-ins
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Hourly Slack scans — who's working on what, auto-updates, and writer
            pings
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          {dates.slice(0, 5).map((d) => (
            <button
              key={d}
              onClick={() => {
                setSelectedDate(d);
                setExpandedHour(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedDate === d
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent"
              }`}
            >
              {relativeDate(d)}
            </button>
          ))}
          {dates.length > 5 && (
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setExpandedHour(null);
              }}
              className="px-2 py-1.5 rounded-lg text-xs bg-gray-50 text-gray-500 border border-gray-200"
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Day summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          icon={<Eye size={14} />}
          label="Scans"
          value={dayCheckins.length}
          color="text-indigo-600"
        />
        <SummaryCard
          icon={<User size={14} />}
          label="People tracked"
          value={uniquePeople.size}
          color="text-blue-600"
        />
        <SummaryCard
          icon={<RefreshCw size={14} />}
          label="Hub updates"
          value={totalUpdates}
          color="text-emerald-600"
        />
        <SummaryCard
          icon={<MessageCircle size={14} />}
          label="Pings sent"
          value={totalPings}
          color="text-amber-600"
        />
      </div>

      {/* People active today */}
      {uniquePeople.size > 0 && (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 bg-blue-50/30">
            <span className="text-xs font-semibold text-gray-700">
              Activity by Person
            </span>
          </div>
          <div className="p-4 space-y-3">
            {[...uniquePeople].sort().map((person) => {
              const personEntries = dayCheckins.flatMap((c) =>
                c.entries
                  .filter((e) => e.person === person)
                  .map((e) => ({ ...e, hour: c.hour }))
              );
              const latestEntry = personEntries[personEntries.length - 1];
              return (
                <div key={person} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">
                    {person.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-gray-900">
                        {person}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {personEntries.length} check-in
                        {personEntries.length !== 1 ? "s" : ""}
                      </span>
                      {latestEntry && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            confidenceColors[latestEntry.confidence]
                          }`}
                        >
                          {latestEntry.confidence}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {latestEntry?.summary || "No summary"}
                    </div>
                    {personEntries.length > 1 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {personEntries.map((e, i) => (
                          <span
                            key={i}
                            className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded"
                          >
                            {formatHour(e.hour)}: {e.summary.slice(0, 50)}
                            {e.summary.length > 50 ? "…" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Timeline */}
      {dayCheckins.length > 0 ? (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50">
            <span className="text-xs font-semibold text-gray-700">
              Hourly Timeline
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {dayCheckins.map((checkin) => (
              <CheckinRow
                key={checkin._id}
                checkin={checkin}
                itemMap={itemMap}
                expanded={expandedHour === checkin.hour}
                onToggle={() =>
                  setExpandedHour(
                    expandedHour === checkin.hour ? null : checkin.hour
                  )
                }
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <Radio size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No check-ins yet for this day</p>
          <p className="text-xs mt-1">
            Scans run every hour — data will appear as activity is detected
          </p>
        </div>
      )}

      {/* Hub updates log */}
      {totalUpdates > 0 && (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 bg-emerald-50/30 flex items-center gap-2">
            <RefreshCw size={13} className="text-emerald-500" />
            <span className="text-xs font-semibold text-gray-700">
              Hub Updates Made
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
              {totalUpdates}
            </span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {dayCheckins.flatMap((c) =>
              c.hub_updates.map((u, i) => {
                const item = itemMap.get(u.item_id);
                return (
                  <div
                    key={`${c._id}-${i}`}
                    className="px-4 py-2.5 flex items-center gap-2.5"
                  >
                    <span className="text-[10px] text-gray-400 tabular-nums w-14 shrink-0">
                      {formatHour(c.hour)}
                    </span>
                    <Zap size={12} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-gray-800 font-medium">
                        {item?.title || u.item_title || u.item_id}
                      </span>
                      <span className="text-[12px] text-gray-400 ml-2">
                        {u.field}:{" "}
                        <span className="text-gray-300 line-through">
                          {u.old_value || "—"}
                        </span>{" "}
                        →{" "}
                        <span className="text-emerald-600 font-medium">
                          {u.new_value || "—"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Pings sent log */}
      {totalPings > 0 && (
        <section className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 bg-amber-50/30 flex items-center gap-2">
            <MessageCircle size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">
              Writer Pings Sent
            </span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
              {totalPings}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {dayCheckins.flatMap((c) =>
              c.pings_sent.map((p, i) => (
                <div
                  key={`${c._id}-${i}`}
                  className="px-4 py-2.5 flex items-center gap-2.5"
                >
                  <span className="text-[10px] text-gray-400 tabular-nums w-14 shrink-0">
                    {formatHour(c.hour)}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {p.person.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] text-gray-800 font-medium">
                      {p.person}
                    </span>
                    <span className="text-[12px] text-gray-400 ml-2">
                      {p.reason}
                    </span>
                  </div>
                  {p.channel && (
                    <span className="text-[10px] text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded">
                      #{p.channel}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function CheckinRow({
  checkin,
  itemMap,
  expanded,
  onToggle,
}: {
  checkin: Checkin;
  itemMap: Map<string, ContentItem>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails =
    checkin.entries.length > 0 ||
    checkin.hub_updates.length > 0 ||
    checkin.pings_sent.length > 0;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition text-left"
      >
        {/* Time dot */}
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-12">
          <Clock size={12} className="text-gray-300" />
          <span className="text-[11px] font-semibold text-gray-700 tabular-nums">
            {formatHour(checkin.hour)}
          </span>
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-gray-800">
            {checkin.summary ||
              `${checkin.entries.length} people tracked`}
          </div>
          <div className="flex gap-3 mt-1">
            {checkin.entries.length > 0 && (
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <User size={10} /> {checkin.entries.length} people
              </span>
            )}
            {checkin.hub_updates.length > 0 && (
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <CheckCircle2 size={10} /> {checkin.hub_updates.length} updates
              </span>
            )}
            {checkin.pings_sent.length > 0 && (
              <span className="text-[10px] text-amber-500 flex items-center gap-1">
                <AlertCircle size={10} /> {checkin.pings_sent.length} pings
              </span>
            )}
          </div>
        </div>

        {/* People avatars */}
        <div className="flex -space-x-1.5">
          {checkin.entries.slice(0, 5).map((e, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold border-2 border-white"
              title={e.person}
            >
              {e.person.charAt(0)}
            </div>
          ))}
        </div>

        {hasDetails &&
          (expanded ? (
            <ChevronDown size={14} className="text-gray-300 shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
          ))}
      </button>

      {/* Expanded detail */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pl-16 space-y-3">
          {/* Entries */}
          {checkin.entries.map((entry, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                {entry.person.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-gray-800">
                    {entry.person}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      confidenceColors[entry.confidence]
                    }`}
                  >
                    {entry.confidence}
                  </span>
                  <span className="text-[9px] text-gray-300">
                    {sourceLabels[entry.source]}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {entry.summary}
                </p>
                {entry.items_updated && entry.items_updated.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {entry.items_updated.map((id) => {
                      const item = itemMap.get(id);
                      return (
                        <span
                          key={id}
                          className="text-[9px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded font-medium"
                        >
                          {item?.title || id}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Hub updates in expanded */}
          {checkin.hub_updates.length > 0 && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Hub updates
              </span>
              {checkin.hub_updates.map((u, i) => {
                const item = itemMap.get(u.item_id);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 mt-1.5 text-[11px]"
                  >
                    <ArrowRight size={10} className="text-emerald-400" />
                    <span className="text-gray-700 font-medium">
                      {item?.title || u.item_title || u.item_id}
                    </span>
                    <span className="text-gray-400">
                      {u.field}: {u.old_value || "—"} → {u.new_value}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pings in expanded */}
          {checkin.pings_sent.length > 0 && (
            <div className="border-t border-gray-100 pt-2 mt-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Pings sent
              </span>
              {checkin.pings_sent.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 mt-1.5 text-[11px]"
                >
                  <MessageCircle size={10} className="text-amber-400" />
                  <span className="text-gray-700 font-medium">{p.person}</span>
                  <span className="text-gray-400">— {p.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
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
