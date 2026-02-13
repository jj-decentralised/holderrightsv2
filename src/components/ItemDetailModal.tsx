import { useState } from "react";
import { updateItem, addActivity, setHandoff, useMembers } from "../store";
import type { ContentItem, ArtStatus } from "../store";
import { X, ExternalLink, Palette, ArrowRightLeft, Clock, FileText, DollarSign } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  pitch: "Pitch", assigned: "Assigned", drafting: "Drafting", review: "Review", copy_edit: "Copy Edit", ready: "Ready", published: "Published", planned: "Planned", booked: "Booked", recorded: "Recorded", editing: "Editing", requested: "Requested", accepted: "Accepted", in_progress: "In Progress", delivered: "Delivered",
};
const ART_STATUSES = [
  { id: "none", label: "No art needed" }, { id: "needs_art", label: "Needs art" }, { id: "art_requested", label: "Art requested" },
  { id: "art_in_progress", label: "Art in progress" }, { id: "art_review", label: "Art in review" }, { id: "art_done", label: "Art done" },
];
const ART_CLS: Record<string, string> = {
  needs_art: "bg-red-50 text-red-600 border-red-100", art_requested: "bg-amber-50 text-amber-600 border-amber-100",
  art_in_progress: "bg-blue-50 text-blue-600 border-blue-100", art_review: "bg-purple-50 text-purple-600 border-purple-100",
  art_done: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

function fmtTs(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "Today " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ItemDetailModal({ item, onClose, onDelete }: { item: ContentItem; onClose: () => void; onDelete?: () => void }) {
  const members = useMembers();
  const [tab, setTab] = useState<"details" | "activity">(item.activity && item.activity.length > 0 ? "details" : "details");
  const [draftUrl, setDraftUrl] = useState(item.draftUrl || "");
  const [handoffTo, setHandoffTo] = useState(item.waitingOn || "");
  const [handoffNote, setHandoffNote] = useState(item.handoffNote || "");
  const [actText, setActText] = useState("");
  const [artStatus, setArtStatus] = useState(item.artStatus || "none");
  const [artAssignee, setArtAssignee] = useState(item.artAssignee || "");
  const [paymentStatus, setPaymentStatus] = useState(item.paymentStatus || "unpaid");

  const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

  const saveDraftUrl = () => { if (draftUrl !== (item.draftUrl || "")) { updateItem(item._id, { draftUrl: draftUrl || undefined }); addActivity(item._id, draftUrl ? "Draft link updated" : "Draft link removed"); } };
  const saveHandoff = () => { if (handoffTo) { setHandoff(item._id, handoffTo, handoffNote || undefined); } else { updateItem(item._id, { waitingOn: undefined, handoffNote: undefined, handoffAt: undefined }); addActivity(item._id, "Handoff cleared"); } };
  const saveArt = () => { updateItem(item._id, { artStatus: artStatus !== "none" ? artStatus as ArtStatus : undefined, artAssignee: artAssignee || undefined }); };
  const savePayment = () => { updateItem(item._id, { paymentStatus: paymentStatus as any }); addActivity(item._id, `Payment → ${paymentStatus}`); };
  const postActivity = () => { if (actText.trim()) { addActivity(item._id, actText.trim()); setActText(""); } };

  const activity = [...(item.activity || [])].sort((a, b) => b.ts - a.ts);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900 leading-snug">{item.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] text-gray-400">{item.assignee || "Unassigned"}</span>
                <span className="text-gray-200">·</span>
                <span className="text-[11px] text-gray-400">{STATUS_LABEL[item.status] || item.status}</span>
                {item.dueDate && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className={`text-[11px] ${item.dueDate < Date.now() && item.status !== "published" ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
          </div>
          {/* Draft link — prominent */}
          {item.draftUrl && (
            <a href={item.draftUrl} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 transition w-fit">
              <ExternalLink size={12} /> Open draft
            </a>
          )}
          {/* Handoff banner */}
          {item.waitingOn && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100">
              <ArrowRightLeft size={12} /> <span className="font-medium">Waiting on {item.waitingOn}</span>
              {item.handoffNote && <span className="text-amber-500 ml-1">— {item.handoffNote}</span>}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 shrink-0">
          {(["details", "activity"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-xs font-medium border-b-2 transition -mb-px ${tab === t ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t === "details" ? "Details" : `Activity (${activity.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === "details" && (
            <>
              {/* Draft URL */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <FileText size={11} /> Draft Link
                </label>
                <div className="flex gap-2">
                  <input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="https://docs.google.com/..." className={sel} />
                  <button onClick={saveDraftUrl} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition shrink-0">Save</button>
                </div>
              </div>

              {/* Handoff */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <ArrowRightLeft size={11} /> Handoff
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select value={handoffTo} onChange={(e) => setHandoffTo(e.target.value)} className={sel}>
                    <option value="">No handoff</option>
                    {members.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}
                  </select>
                  <input value={handoffNote} onChange={(e) => setHandoffNote(e.target.value)} placeholder="Note…" className={sel} />
                </div>
                <button onClick={saveHandoff} className="mt-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition">Update handoff</button>
              </div>

              {/* Art status (compact) */}
              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                  <Palette size={11} /> Art
                </label>
                <div className="flex gap-2">
                  <select value={artStatus} onChange={(e) => setArtStatus(e.target.value)} className={sel}>
                    {ART_STATUSES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  <select value={artAssignee} onChange={(e) => setArtAssignee(e.target.value)} className={sel}>
                    <option value="">Designer</option>
                    {members.filter((m) => m.role.toLowerCase().includes("design") || m.name === "Andres").map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}
                    {members.filter((m) => !m.role.toLowerCase().includes("design") && m.name !== "Andres").map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}
                  </select>
                  <button onClick={saveArt} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition shrink-0">Save</button>
                </div>
              </div>

              {/* Payment (only for sponsored/portfolio) */}
              {(item.category === "sponsored" || item.category === "collaboration" || item.type === "portfolio") && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                    <DollarSign size={11} /> Payment
                  </label>
                  <div className="flex gap-2">
                    <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={sel}>
                      <option value="unpaid">Unpaid</option>
                      <option value="invoiced">Invoiced</option>
                      <option value="paid">Paid</option>
                    </select>
                    {item.dealValue && <div className="flex items-center text-sm text-gray-500 px-3">${item.dealValue.toLocaleString()}</div>}
                    <button onClick={savePayment} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-600 transition shrink-0">Save</button>
                  </div>
                </div>
              )}

              {item.notes && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{item.notes}</p>
                </div>
              )}
            </>
          )}

          {tab === "activity" && (
            <div className="space-y-3">
              {/* Add activity */}
              <div className="flex gap-2">
                <input value={actText} onChange={(e) => setActText(e.target.value)} placeholder="Add a note…" className={sel}
                  onKeyDown={(e) => { if (e.key === "Enter") postActivity(); }} />
                <button onClick={postActivity} disabled={!actText.trim()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-lg text-xs font-medium transition shrink-0">Post</button>
              </div>
              {/* Timeline */}
              {activity.length === 0 ? (
                <p className="text-center text-xs text-gray-300 py-6">No activity yet</p>
              ) : (
                <div className="relative pl-4 space-y-0">
                  <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-100" />
                  {activity.map((a, idx) => (
                    <div key={idx} className="relative flex items-start gap-2.5 py-2">
                      <div className="absolute left-[-12px] top-[10px] w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-200 z-10" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-gray-700">{a.text}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {a.by && <span className="font-medium text-gray-500">{a.by} · </span>}
                          {fmtTs(a.ts)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2 shrink-0">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition">Close</button>
          {onDelete && <button onClick={onDelete} className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2 rounded-lg text-sm font-medium transition">Delete</button>}
        </div>
      </div>
    </div>
  );
}
