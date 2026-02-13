import { useState } from "react";
import { useItems, useMembers, removeItem } from "../store";
import type { ContentItem } from "../store";
import { ItemDetailModal } from "../components/ItemDetailModal";
import { DollarSign, ExternalLink, ArrowRightLeft, Palette, AlertTriangle } from "lucide-react";

const STATUS_DOT: Record<string, string> = { pitch: "bg-gray-400", assigned: "bg-blue-400", drafting: "bg-amber-400", review: "bg-purple-400", copy_edit: "bg-pink-400", ready: "bg-teal-400", published: "bg-emerald-400", requested: "bg-gray-400", accepted: "bg-blue-400", in_progress: "bg-amber-400", delivered: "bg-emerald-400" };
const STATUS_LABEL: Record<string, string> = { pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit", ready: "Ready", published: "Published", requested: "Requested", accepted: "Accepted", in_progress: "In Progress", delivered: "Delivered" };
const PAY_CLS: Record<string, string> = { paid: "bg-emerald-50 text-emerald-600 border-emerald-200", invoiced: "bg-amber-50 text-amber-600 border-amber-200", unpaid: "bg-gray-50 text-gray-500 border-gray-200" };
const ART_SHORT: Record<string, string> = { needs_art: "Needs art", art_requested: "Requested", art_in_progress: "In progress", art_review: "Review", art_done: "Done" };
const ART_CLS: Record<string, string> = { needs_art: "text-red-500", art_requested: "text-amber-500", art_in_progress: "text-blue-500", art_review: "text-purple-500", art_done: "text-emerald-500" };

function relTime(ts: number) {
  const days = Math.round((ts - Date.now()) / 86400000);
  if (days === 0) return "Today";
  if (days === -1) return "Yesterday";
  if (days < -1) return `${Math.abs(days)}d overdue`;
  if (days === 1) return "Tomorrow";
  return `In ${days}d`;
}

export function DealsTracker() {
  const allItems = useItems();
  const [selected, setSelected] = useState<ContentItem | null>(null);

  // All paid/collab items across editorial + portfolio
  const deals = allItems.filter((i) =>
    i.category === "sponsored" || i.category === "collaboration" ||
    (i.type === "portfolio" && i.requestType === "Paid Engagement")
  ).sort((a, b) => {
    // Sort: active first, then by due date
    const aActive = a.status !== "published" && a.status !== "delivered" ? 0 : 1;
    const bActive = b.status !== "published" && b.status !== "delivered" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    return 1;
  });

  const totalValue = deals.reduce((s, i) => s + (i.dealValue || 0), 0);
  const unpaidValue = deals.filter((i) => !i.paymentStatus || i.paymentStatus === "unpaid").reduce((s, i) => s + (i.dealValue || 0), 0);
  const noDate = deals.filter((i) => !i.dueDate && i.status !== "published" && i.status !== "delivered");
  const overdue = deals.filter((i) => i.dueDate && i.dueDate < Date.now() && i.status !== "published" && i.status !== "delivered");

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="text-lg font-bold text-gray-900">{deals.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Total deals</div>
        </div>
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="text-lg font-bold text-gray-900">${totalValue.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Total value</div>
        </div>
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className={`text-lg font-bold ${unpaidValue > 0 ? "text-amber-600" : "text-gray-400"}`}>${unpaidValue.toLocaleString()}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Unpaid</div>
        </div>
        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className={`text-lg font-bold ${overdue.length > 0 ? "text-red-600" : "text-gray-400"}`}>{overdue.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Overdue</div>
        </div>
      </div>

      {/* Warnings */}
      {noDate.length > 0 && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700"><strong>{noDate.length} deal{noDate.length > 1 ? "s" : ""}</strong> with no deadline set: {noDate.map((i) => i.client || i.title).join(", ")}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-gray-400 text-xs">
              <th className="text-left px-5 py-2.5 font-medium">Client / Deal</th>
              <th className="text-left px-3 py-2.5 font-medium">Writer</th>
              <th className="text-left px-3 py-2.5 font-medium">Stage</th>
              <th className="text-left px-3 py-2.5 font-medium">Art</th>
              <th className="text-left px-3 py-2.5 font-medium">Due</th>
              <th className="text-left px-3 py-2.5 font-medium">Value</th>
              <th className="text-left px-3 py-2.5 font-medium">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {deals.map((item) => {
              const isOverdue = item.dueDate && item.dueDate < Date.now() && item.status !== "published" && item.status !== "delivered";
              const pay = item.paymentStatus || "unpaid";
              return (
                <tr key={item._id} onClick={() => setSelected(item)} className={`cursor-pointer hover:bg-gray-50 transition ${isOverdue ? "bg-red-50/30" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900">{item.client || item.title}</span>
                      {item.draftUrl && <a href={item.draftUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-400 hover:text-indigo-600"><ExternalLink size={11} /></a>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-400">{item.title !== (item.client || item.title) ? item.title : item.type}</span>
                      {item.waitingOn && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 bg-amber-50 border border-amber-100 px-1 py-0.5 rounded font-medium">
                          <ArrowRightLeft size={8} /> {item.waitingOn}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{item.assignee || <span className="text-red-400">Unassigned</span>}</td>
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status] || "bg-gray-300"}`} />
                      <span className="text-xs text-gray-600">{STATUS_LABEL[item.status] || item.status}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {item.artStatus && item.artStatus !== "none" ? (
                      <span className={`text-[10px] font-medium flex items-center gap-0.5 ${ART_CLS[item.artStatus] || "text-gray-400"}`}>
                        <Palette size={9} /> {ART_SHORT[item.artStatus] || item.artStatus}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className={`px-3 py-3 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                    {item.dueDate ? relTime(item.dueDate) : <span className="text-amber-400">No date</span>}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600 font-medium tabular-nums">
                    {item.dealValue ? `$${item.dealValue.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${PAY_CLS[pay]}`}>
                      {pay}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && <ItemDetailModal item={selected} onClose={() => setSelected(null)} onDelete={() => { removeItem(selected._id); setSelected(null); }} />}
    </div>
  );
}
