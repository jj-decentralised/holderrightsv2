import { useState, useRef, useEffect } from "react";
import { updateItem, addActivity, setHandoff, useMembers } from "../store";
import type { ContentItem } from "../store";
import { ExternalLink, Link, ChevronDown, X } from "lucide-react";

/* ─── Inline Draft Link ─── */
export function InlineDraftLink({ item, compact }: { item: ContentItem; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(item.draftUrl || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const save = () => {
    if (url.trim() !== (item.draftUrl || "")) {
      updateItem(item._id, { draftUrl: url.trim() || undefined });
      addActivity(item._id, url.trim() ? "Draft link added" : "Draft link removed");
    }
    setEditing(false);
  };

  // Has link — show clickable badge
  if (item.draftUrl && !editing) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <a href={item.draftUrl} target="_blank" rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 font-medium transition ${
            compact
              ? "text-[10px] text-indigo-500 hover:text-indigo-700"
              : "text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100"
          }`}
          onClick={(e) => e.stopPropagation()}>
          <ExternalLink size={compact ? 9 : 11} /> {compact ? "Doc" : "Open doc"}
        </a>
        <button onClick={(e) => { e.stopPropagation(); setEditing(true); setUrl(item.draftUrl || ""); }}
          className="text-[9px] text-gray-300 hover:text-gray-500 transition ml-0.5" title="Change link">✎</button>
      </span>
    );
  }

  // No link — show input prompt
  if (!item.draftUrl && !editing) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className={`inline-flex items-center gap-1 text-gray-300 hover:text-indigo-500 transition ${
          compact ? "text-[10px]" : "text-xs bg-gray-50 hover:bg-indigo-50 px-2 py-1 rounded-md border border-dashed border-gray-200 hover:border-indigo-200"
        }`}>
        <Link size={compact ? 9 : 11} /> {compact ? "+ link" : "Paste doc link"}
      </button>
    );
  }

  // Editing
  return (
    <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input ref={inputRef} value={url} onChange={(e) => setUrl(e.target.value)}
        placeholder="https://docs.google.com/..."
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        onBlur={save}
        className="text-xs border border-indigo-200 rounded px-2 py-1 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white" />
      <button onClick={() => setEditing(false)} className="text-gray-300 hover:text-gray-500"><X size={12} /></button>
    </span>
  );
}

/* ─── Inline Status Picker ─── */
export function InlineStatus({ item, statuses }: { item: ContentItem; statuses: { id: string; label: string; dot: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = statuses.find((s) => s.id === item.status) || statuses[0];

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition group">
        <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
        <span>{current.label}</span>
        <ChevronDown size={10} className="text-gray-300 group-hover:text-gray-500 transition" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[120px]">
          {statuses.map((s) => (
            <button key={s.id} onClick={(e) => {
              e.stopPropagation();
              if (s.id !== item.status) {
                updateItem(item._id, { status: s.id });
                addActivity(item._id, `Status → ${s.label}`);
              }
              setOpen(false);
            }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 transition ${item.status === s.id ? "font-medium text-gray-900" : "text-gray-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Inline Assignee Picker ─── */
export function InlineAssignee({ item }: { item: ContentItem }) {
  const members = useMembers();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-[11px] text-gray-400 hover:text-gray-700 transition group flex items-center gap-0.5">
        {item.assignee || "Unassigned"}
        <ChevronDown size={9} className="text-gray-200 group-hover:text-gray-400 transition" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-[130px]">
          <button onClick={(e) => {
            e.stopPropagation();
            updateItem(item._id, { assignee: undefined });
            addActivity(item._id, "Unassigned");
            setOpen(false);
          }}
            className={`w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 transition ${!item.assignee ? "font-medium" : ""}`}>
            Unassigned
          </button>
          {members.map((m) => (
            <button key={m._id} onClick={(e) => {
              e.stopPropagation();
              if (m.name !== item.assignee) {
                updateItem(item._id, { assignee: m.name });
                addActivity(item._id, `Assigned to ${m.name}`);
              }
              setOpen(false);
            }}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-50 transition ${item.assignee === m.name ? "font-medium text-gray-900" : "text-gray-600"}`}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: m.avatarColor || "#9ca3af" }}>
                {m.name.charAt(0)}
              </span>
              {m.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Inline Due Date Picker ─── */
export function InlineDueDate({ item }: { item: ContentItem }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) { inputRef.current.showPicker?.(); inputRef.current.focus(); } }, [editing]);

  const isOverdue = item.dueDate && item.dueDate < Date.now() && item.status !== "published" && item.status !== "delivered";
  const days = item.dueDate ? Math.round((item.dueDate - Date.now()) / 86400000) : null;
  const label = days === null ? "No date" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : days === -1 ? "Yesterday" : days < -1 ? `${Math.abs(days)}d overdue` : `In ${days}d`;

  if (editing) {
    return (
      <input ref={inputRef} type="date"
        defaultValue={item.dueDate ? new Date(item.dueDate).toISOString().split("T")[0] : ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val) {
            updateItem(item._id, { dueDate: new Date(val).getTime() });
            addActivity(item._id, `Due date → ${new Date(val).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);
          }
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
        onClick={(e) => e.stopPropagation()}
        className="text-xs border border-gray-200 rounded px-1.5 py-0.5 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
    );
  }

  return (
    <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className={`text-[11px] tabular-nums transition hover:underline ${
        isOverdue ? "text-red-500 font-medium" : days === 0 ? "text-amber-600 font-medium" : item.dueDate ? "text-gray-400 hover:text-gray-600" : "text-gray-300 hover:text-gray-500"
      }`}>
      {label}
    </button>
  );
}

/* ─── Quick Add Bar ─── */
export function QuickAddBar({ type, defaultStatus, placeholder, onCreate }: {
  type: ContentItem["type"];
  defaultStatus: string;
  placeholder?: string;
  onCreate?: (item: Partial<ContentItem>) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const text = value.trim();
    if (!text) return;

    // Detect if a URL is pasted alongside the title
    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
    const title = urlMatch ? text.replace(urlMatch[0], "").trim() : text;
    const draftUrl = urlMatch ? urlMatch[0] : undefined;

    if (onCreate) {
      onCreate({ type, title: title || "Untitled", status: defaultStatus, draftUrl });
    }
    setValue("");
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition">
      <span className="text-gray-300 text-sm">+</span>
      <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || "Add item... (paste a Google Doc URL to auto-attach)"}
        onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
        className="flex-1 text-sm bg-transparent border-0 focus:outline-none placeholder:text-gray-300" />
      {value.trim() && (
        <button onClick={handleSubmit} className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition shrink-0">
          Add ↵
        </button>
      )}
    </div>
  );
}
