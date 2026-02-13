import { useState, useRef } from "react";
import { useItems, useMembers, createItem, updateItem, updateStatus, removeItem } from "../store";
import { Plus, X, AlignLeft, MessageSquare, Repeat2, GripVertical } from "lucide-react";

const COLS = [
  { id: "pitch", label: "Pitch", dot: "bg-gray-400" },
  { id: "drafting", label: "Drafting", dot: "bg-amber-400" },
  { id: "review", label: "Review", dot: "bg-blue-400" },
  { id: "published", label: "Published", dot: "bg-emerald-400" },
];

const FMT: Record<string, { icon: React.ReactNode; label: string }> = {
  thread: { icon: <AlignLeft size={11} />, label: "Thread" },
  single: { icon: <MessageSquare size={11} />, label: "Single" },
  quote_tweet: { icon: <Repeat2 size={11} />, label: "Quote" },
};

export function TwitterBoard() {
  const items = useItems("twitter");
  const members = useMembers();
  const [modal, setModal] = useState<"add" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [f, setF] = useState({ title: "", assignee: "", format: "thread", notes: "" });

  // Drag and drop state
  const dragItem = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    dragItem.current = null;
    setDragOverCol(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragItem.current) {
      const item = items.find((i) => i._id === dragItem.current);
      if (item && item.status !== colId) {
        updateStatus(dragItem.current, colId);
      }
      dragItem.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{items.length} items</p>
        <button onClick={() => setModal("add")} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-medium transition">
          <Plus size={14} /> New idea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.map((col) => {
          const colItems = items.filter((i) => i.status === col.id);
          const isOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className={`rounded-xl border transition-all duration-150 ${
                isOver
                  ? "bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-200"
                  : "bg-gray-50 border-gray-200"
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="px-4 py-3 flex items-center gap-2 border-b border-gray-100">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                <span className="ml-auto text-xs text-gray-400">{colItems.length}</span>
              </div>
              <div className={`p-2 space-y-2 min-h-[180px] transition-all ${isOver ? "min-h-[220px]" : ""}`}>
                {colItems.map((item) => (
                  <div
                    key={item._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item._id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setEditing({ ...item })}
                    className="bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition group select-none"
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="text-gray-300 mt-0.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <GripVertical size={12} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {item.format && FMT[item.format] && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                              {FMT[item.format].icon} {FMT[item.format].label}
                            </span>
                          )}
                          {item.assignee && <span className="text-[11px] text-gray-400">{item.assignee}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isOver && colItems.length === 0 && (
                  <div className="border-2 border-dashed border-indigo-200 rounded-lg p-4 text-center text-xs text-indigo-400">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal === "add" && (
        <Modal title="New Tweet Idea" onClose={() => setModal(null)}>
          <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} autoFocus placeholder="What's the tweet about?" />
          <Row>
            <Select label="Assignee" value={f.assignee} onChange={(v) => setF({ ...f, assignee: v })} options={[{ v: "", l: "Unassigned" }, ...members.map((m) => ({ v: m.name, l: m.name }))]} />
            <Select label="Format" value={f.format} onChange={(v) => setF({ ...f, format: v })} options={[{ v: "thread", l: "Thread" }, { v: "single", l: "Single" }, { v: "quote_tweet", l: "Quote" }]} />
          </Row>
          <TextArea label="Notes" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} placeholder="Research links, talking points…" />
          <Btn disabled={!f.title.trim()} onClick={() => { createItem({ type: "twitter", title: f.title.trim(), status: "pitch", assignee: f.assignee || undefined, format: f.format, notes: f.notes || undefined }); setF({ title: "", assignee: "", format: "thread", notes: "" }); setModal(null); }}>Add idea</Btn>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit" onClose={() => setEditing(null)}>
          <Field label="Title" value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
          <Row>
            <Select label="Assignee" value={editing.assignee || ""} onChange={(v) => setEditing({ ...editing, assignee: v })} options={[{ v: "", l: "Unassigned" }, ...members.map((m) => ({ v: m.name, l: m.name }))]} />
            <Select label="Format" value={editing.format || "thread"} onChange={(v) => setEditing({ ...editing, format: v })} options={[{ v: "thread", l: "Thread" }, { v: "single", l: "Single" }, { v: "quote_tweet", l: "Quote" }]} />
          </Row>
          <TextArea label="Notes" value={editing.notes || ""} onChange={(v) => setEditing({ ...editing, notes: v })} />
          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => { updateItem(editing._id, { title: editing.title, assignee: editing.assignee || undefined, format: editing.format, notes: editing.notes || undefined }); setEditing(null); }}>Save</Btn>
            <Btn variant="danger" onClick={() => { removeItem(editing._id); setEditing(null); }}>Delete</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-base font-semibold text-gray-900">{title}</h3><button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
function Field({ label, value, onChange, autoFocus, placeholder }: any) {
  return (<div><label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label><input value={value} onChange={(e: any) => onChange(e.target.value)} autoFocus={autoFocus} placeholder={placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>);
}
function TextArea({ label, value, onChange, placeholder }: any) {
  return (<div><label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label><textarea value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" /></div>);
}
function Select({ label, value, onChange, options }: any) {
  return (<div><label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label><select value={value} onChange={(e: any) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">{options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>);
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function Btn({ children, onClick, disabled, className, variant }: any) {
  const base = variant === "danger" ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-100 disabled:text-gray-400";
  return <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${base} ${className || ""}`}>{children}</button>;
}
