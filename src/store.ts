import { useSyncExternalStore } from "react";

/* ─── Types ─── */
export type ArtStatus = "none" | "needs_art" | "art_requested" | "art_in_progress" | "art_review" | "art_done";

export interface ActivityEntry {
  ts: number;
  text: string;
  by?: string;
}

export interface ContentItem {
  _id: string;
  type: "twitter" | "editorial" | "ttd" | "podcast" | "portfolio";
  title: string;
  description?: string;
  status: string;
  assignee?: string;
  dueDate?: number;
  category?: string;
  format?: string;
  guest?: string;
  company?: string;
  requestType?: string;
  weekNumber?: number;
  priority?: "low" | "medium" | "high";
  notes?: string;
  createdBy?: string;
  /* Draft / deliverable link */
  draftUrl?: string;
  /* Art / Creative tracking */
  artStatus?: ArtStatus;
  artAssignee?: string;
  artNotes?: string;
  artDueDate?: number;
  /* Handoff tracking */
  waitingOn?: string;
  handoffNote?: string;
  handoffAt?: number;
  /* Paid engagement tracking */
  paymentStatus?: "unpaid" | "invoiced" | "paid";
  dealValue?: number;
  client?: string;
  /* Activity log */
  activity?: ActivityEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface CheckinEntry {
  person: string;
  summary: string;
  items_updated?: string[];
  source: "slack_scan" | "direct_ping" | "manual";
  confidence: "high" | "medium" | "low";
}

export interface HubUpdate {
  item_id: string;
  item_title?: string;
  field: string;
  old_value?: string;
  new_value?: string;
}

export interface PingSent {
  person: string;
  reason: string;
  channel?: string;
}

export interface Checkin {
  _id: string;
  date: string; // YYYY-MM-DD
  hour: number;
  ts: number;
  entries: CheckinEntry[];
  hub_updates: HubUpdate[];
  pings_sent: PingSent[];
  summary?: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  email?: string;
  avatarColor?: string;
}

/* ─── External store for cross-component reactivity ─── */
let items: ContentItem[] = [];
let members: TeamMember[] = [];
let checkins: Checkin[] = [];
let listeners = new Set<() => void>();
let dataVersion = 0;

function emit() { dataVersion++; listeners.forEach((l) => l()); }

function persist() {
  localStorage.setItem("dco_items", JSON.stringify(items));
  localStorage.setItem("dco_members", JSON.stringify(members));
  localStorage.setItem("dco_checkins", JSON.stringify(checkins));
  localStorage.setItem("dco_version", String(dataVersion));
}

function load() {
  try {
    const i = localStorage.getItem("dco_items");
    const m = localStorage.getItem("dco_members");
    const c = localStorage.getItem("dco_checkins");
    if (i) items = JSON.parse(i);
    if (m) members = JSON.parse(m);
    if (c) checkins = JSON.parse(c);
  } catch {}
}

/* ─── Remote data sync ─── */
async function fetchRemoteData() {
  try {
    const resp = await fetch("/data.json?t=" + Date.now());
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const localVersion = localStorage.getItem("dco_version") || "0";
      const remoteVersion = String(data.version || 0);
      // Remote wins if version is newer, but never overwrite with empty data
      if (Number(remoteVersion) >= Number(localVersion) || items.length === 0) {
        items = data.items;
        if (data.members) members = data.members;
        if (data.checkins) checkins = data.checkins;
        dataVersion = Number(remoteVersion);
        persist();
        emit();
      }
    }
  } catch {}
}

/* ─── Seed data ─── */
function seedIfEmpty() {
  if (members.length === 0) {
    members = [
      { _id: "m1", name: "Joel", role: "Founder / Editor-in-Chief", email: "joel@decentralised.co", avatarColor: "#4f46e5" },
      { _id: "m2", name: "Sid", role: "Co-founder / Venture", email: "sid@decentralised.co", avatarColor: "#7c3aed" },
      { _id: "m3", name: "Saurabh", role: "Lead Researcher", email: "saurabh@decentralised.co", avatarColor: "#db2777" },
      { _id: "m4", name: "Vaidik", role: "Staff Writer", email: "vaidik@decentralised.co", avatarColor: "#d97706" },
      { _id: "m5", name: "Nishil", role: "Staff Writer", email: "nishil@decentralised.co", avatarColor: "#059669" },
      { _id: "m6", name: "Ruwanthi", role: "Operations", email: "ruwanthi@decentralised.co", avatarColor: "#0891b2" },
      { _id: "m7", name: "Sagar", role: "Video / Content", email: "sagar@decentralised.co", avatarColor: "#ea580c" },
      { _id: "m8", name: "Anish", role: "Growth", email: "anish@decentralised.co", avatarColor: "#0d9488" },
      { _id: "m9", name: "Andres", role: "Designer (External)", email: "andreslozano92@gmail.com", avatarColor: "#8b5cf6" },
      { _id: "m10", name: "Prathik", role: "TTD Writer", avatarColor: "#6366f1" },
      { _id: "m11", name: "Thejaswini", role: "TTD Writer", avatarColor: "#ec4899" },
    ];
  }
  if (items.length === 0) {
    const now = Date.now();
    const day = 86400000;
    items = [
      // Twitter
      { _id: "t1", type: "twitter", title: "Virtuals ecosystem breakdown", status: "pitch", format: "thread", activity: [{ ts: now, text: "Created", by: "Joel" }], createdAt: now, updatedAt: now },
      { _id: "t2", type: "twitter", title: "Forms of capital formation in crypto", status: "pitch", format: "thread", activity: [{ ts: now, text: "Created", by: "Joel" }], createdAt: now, updatedAt: now },
      { _id: "t3", type: "twitter", title: "A note on capital formation in crypto", status: "pitch", format: "single", activity: [{ ts: now, text: "Created", by: "Joel" }], createdAt: now, updatedAt: now },
      { _id: "t4", type: "twitter", title: "What if MetaDAO went permissionless", status: "pitch", format: "thread", activity: [{ ts: now, text: "Created", by: "Joel" }], createdAt: now, updatedAt: now },
      { _id: "t5", type: "twitter", title: "Virtuals Protocol analysis", status: "drafting", assignee: "Vaidik", format: "thread", waitingOn: "Sid", handoffNote: "Joel asked Vaidik to share with Sid once done", handoffAt: now - 4 * 3600000, activity: [{ ts: now - 6 * 3600000, text: "Joel asked Vaidik to finish and take live", by: "Joel" }, { ts: now - 5 * 3600000, text: "Vaidik: on it, finishing now", by: "Vaidik" }, { ts: now - 4 * 3600000, text: "Joel: share with Sid once done", by: "Joel" }, { ts: now - 3.5 * 3600000, text: "Vaidik: Okayy", by: "Vaidik" }], createdAt: now, updatedAt: now },

      // Editorial — organic
      { _id: "e1", type: "editorial", title: "ZkSync Thesis", status: "drafting", assignee: "Saurabh", dueDate: now - 24 * day, category: "organic", activity: [{ ts: now - 24 * day, text: "Marked overdue — no update", by: "System" }], createdAt: now, updatedAt: now - 20 * day },
      { _id: "e2", type: "editorial", title: "Semiliquid", status: "assigned", assignee: "Joel", dueDate: now - 18 * day, category: "organic", createdAt: now, updatedAt: now - 15 * day },
      { _id: "e3", type: "editorial", title: "Holder Rights", status: "assigned", assignee: "Joel", dueDate: now - 10 * day, category: "organic", createdAt: now, updatedAt: now - 8 * day },
      { _id: "e4", type: "editorial", title: "Drift Thesis", status: "assigned", assignee: "Joel", dueDate: now - 9 * day, category: "organic", createdAt: now, updatedAt: now - 7 * day },
      { _id: "e7", type: "editorial", title: "Crypto revenue analysis", status: "drafting", assignee: "Saurabh", dueDate: now - 1 * day, category: "organic", createdAt: now, updatedAt: now - 1 * day },
      { _id: "e11", type: "editorial", title: "Futarchy", status: "pitch", assignee: "Joel", category: "organic", createdAt: now, updatedAt: now },
      { _id: "e12", type: "editorial", title: "Ethena Thesis", status: "pitch", category: "organic", createdAt: now, updatedAt: now },
      { _id: "e_stale", type: "editorial", title: "Low interest rates & stablecoins", status: "pitch", category: "internal_research", dueDate: now - 129 * day, activity: [{ ts: now - 129 * day, text: "Overdue since Oct 7 2025 — no owner", by: "System" }], createdAt: now - 140 * day, updatedAt: now - 130 * day },

      // Editorial — sponsored (with art + paid tracking)
      { _id: "e5", type: "editorial", title: "LiFi", status: "review", assignee: "Saurabh", dueDate: now - 8 * day, category: "sponsored", client: "LiFi", artStatus: "art_in_progress" as ArtStatus, artAssignee: "Andres", artNotes: "Cover art + 3 inline graphics", paymentStatus: "invoiced", dealValue: 5000, activity: [{ ts: now - 14 * day, text: "Saurabh started drafting", by: "Saurabh" }, { ts: now - 8 * day, text: "Draft submitted for review", by: "Saurabh" }, { ts: now - 5 * day, text: "Art requested from Andres", by: "Joel" }], createdAt: now, updatedAt: now - 5 * day },
      { _id: "e6", type: "editorial", title: "LayerZero", status: "assigned", assignee: "Joel", dueDate: now - 4 * day, category: "sponsored", client: "LayerZero", artStatus: "needs_art" as ArtStatus, artNotes: "Need cover image, brand kit shared in #art-lifi", paymentStatus: "unpaid", dealValue: 5000, createdAt: now, updatedAt: now - 3 * day },
      { _id: "e8", type: "editorial", title: "Saffron", status: "assigned", assignee: "Saurabh", dueDate: now + 3 * day, category: "sponsored", client: "Saffron Finance", artStatus: "art_requested" as ArtStatus, artAssignee: "Andres", artDueDate: now + 2 * day, paymentStatus: "unpaid", dealValue: 4000, activity: [{ ts: now, text: "Assigned to Saurabh", by: "Joel" }], createdAt: now, updatedAt: now },
      { _id: "e9", type: "editorial", title: "Ronin Deep Dive", status: "drafting", assignee: "Joel", category: "sponsored", client: "Ronin", artStatus: "art_done" as ArtStatus, artAssignee: "Andres", paymentStatus: "paid", dealValue: 5000, createdAt: now, updatedAt: now - 10 * day },
      { _id: "e10", type: "editorial", title: "Gravity / ZkSync", status: "assigned", assignee: "Vaidik", category: "sponsored", client: "Gravity", artStatus: "needs_art" as ArtStatus, paymentStatus: "unpaid", dealValue: 4000, createdAt: now, updatedAt: now },

      // Editorial — collaborations
      { _id: "e13", type: "editorial", title: "Bebop", status: "pitch", assignee: "Joel", category: "collaboration", client: "Bebop", createdAt: now, updatedAt: now },
      { _id: "e14", type: "editorial", title: "Nox", status: "pitch", assignee: "Saurabh", category: "collaboration", client: "Nox", createdAt: now, updatedAt: now },
      { _id: "e15", type: "editorial", title: "White Star", status: "pitch", assignee: "Sid", category: "collaboration", client: "White Star", createdAt: now, updatedAt: now },

      // TTD — last week (published)
      { _id: "d1", type: "ttd", title: "Trading uranium on-chain", status: "published", assignee: "Vaidik", dueDate: now - 12 * day, weekNumber: 6, createdAt: now, updatedAt: now - 12 * day },
      { _id: "d2", type: "ttd", title: "Book review – The Bitcoin Standard", status: "published", assignee: "Thejaswini", dueDate: now - 11 * day, weekNumber: 6, createdAt: now, updatedAt: now - 11 * day },
      { _id: "d3", type: "ttd", title: "Quants piece – on-chain lending", status: "published", assignee: "Prathik", dueDate: now - 10 * day, weekNumber: 6, createdAt: now, updatedAt: now - 10 * day },
      { _id: "d4", type: "ttd", title: "Hype's prediction markets", status: "published", assignee: "Thejaswini", dueDate: now - 9 * day, weekNumber: 6, createdAt: now, updatedAt: now - 9 * day },
      { _id: "d4b", type: "ttd", title: "Virtuals Protocol 60-day framework", status: "published", assignee: "Thejaswini", dueDate: now - 8 * day, weekNumber: 6, createdAt: now, updatedAt: now - 8 * day },
      { _id: "d4c", type: "ttd", title: "Galaxy results", status: "published", assignee: "Prathik", dueDate: now - 7 * day, weekNumber: 6, createdAt: now, updatedAt: now - 7 * day },
      { _id: "d4d", type: "ttd", title: "Tokenisation", status: "published", assignee: "Nishil", dueDate: now - 6 * day, weekNumber: 6, createdAt: now, updatedAt: now - 6 * day },
      { _id: "d5", type: "ttd", title: "AI agentic economy", status: "published", assignee: "Vaidik", dueDate: now - 5 * day, weekNumber: 6, createdAt: now, updatedAt: now - 5 * day },

      // TTD — this week
      { _id: "d6a", type: "ttd", title: "Sponsorship – Reality network", status: "published", assignee: "Thejaswini", dueDate: now - 4 * day, weekNumber: 7, createdAt: now, updatedAt: now - 4 * day },
      { _id: "d6b", type: "ttd", title: "Vitalik is right and why?", status: "published", assignee: "Thejaswini", dueDate: now - 3 * day, weekNumber: 7, createdAt: now, updatedAt: now - 3 * day },
      { _id: "d6c", type: "ttd", title: "Quants piece – Perps story", status: "published", assignee: "Prathik", dueDate: now - 2 * day, weekNumber: 7, createdAt: now, updatedAt: now - 2 * day },
      { _id: "d6d", type: "ttd", title: "Blockchain privacy", status: "drafting", assignee: "Prathik", dueDate: now - 1 * day, weekNumber: 7, draftUrl: "https://docs.google.com/document/d/...", activity: [{ ts: now - 1 * day, text: "Due yesterday — no submission", by: "System" }], createdAt: now, updatedAt: now - 1 * day },
      { _id: "d6e", type: "ttd", title: "Entertainment + Finance", status: "drafting", assignee: "Vaidik", dueDate: now - 1 * day, weekNumber: 7, activity: [{ ts: now - 1 * day, text: "Due yesterday — no submission", by: "System" }], createdAt: now, updatedAt: now - 1 * day },
      { _id: "d6f", type: "ttd", title: "Reading list", status: "drafting", assignee: "Prathik", dueDate: now, weekNumber: 7, draftUrl: "https://docs.google.com/document/d/1bcYg3CpkOyKjNExvvvqyEiFuYLfJC6vXmSfKr4RsHhM/edit", activity: [{ ts: now - 2 * 3600000, text: "Prathik shared doc — submitted late (midday)", by: "Prathik" }, { ts: now - 1.5 * 3600000, text: "Joel: too late, need earlier submissions", by: "Joel" }], createdAt: now, updatedAt: now },
      { _id: "d7", type: "ttd", title: "Silver of Tradfi", status: "review", assignee: "Nishil", dueDate: now + 1 * day, weekNumber: 7, draftUrl: "https://docs.google.com/document/d/13PX5Dm1-YYn1K6rO1LfroOleWxSH2tsWwPfmfMZ2vS4/edit", waitingOn: "Joel", handoffNote: "Nishil revised per Joel's feedback, back for review", handoffAt: now - 1 * 3600000, activity: [{ ts: now - 24 * 3600000, text: "Nishil submitted first draft in #dco-ttd", by: "Nishil" }, { ts: now - 12 * 3600000, text: "Joel gave feedback", by: "Joel" }, { ts: now - 1 * 3600000, text: "Nishil: made changes, passed back for review", by: "Nishil" }], createdAt: now, updatedAt: now },

      // Podcast
      { _id: "p1", type: "podcast", title: "Philipp (LiFi)", status: "booked", assignee: "Saurabh", dueDate: now - 3 * day, guest: "Philipp Zentner", createdAt: now, updatedAt: now },
      { _id: "p2", type: "podcast", title: "Architect Protocol", status: "planned", assignee: "Saurabh", dueDate: now + 4 * day, guest: "TBD", createdAt: now, updatedAt: now },

      // Portfolio / Paid engagements
      { _id: "r1", type: "portfolio", title: "Onchain assets article", status: "in_progress", assignee: "Nishil", company: "Portfolio Co", requestType: "Article", client: "Internal", createdAt: now, updatedAt: now },
      { _id: "r2", type: "portfolio", title: "Aquanow write-up", status: "accepted", assignee: "Joel", company: "Aquanow", requestType: "Article", client: "Aquanow", paymentStatus: "unpaid", createdAt: now, updatedAt: now },
      { _id: "r3", type: "portfolio", title: "Gearbox engagement", status: "requested", company: "Gearbox", requestType: "Paid Engagement", client: "Gearbox", paymentStatus: "unpaid", createdAt: now, updatedAt: now },
      { _id: "r4", type: "portfolio", title: "Talus engagement", status: "requested", company: "Talus", requestType: "Paid Engagement", client: "Talus", paymentStatus: "unpaid", createdAt: now, updatedAt: now },
      { _id: "r5", type: "portfolio", title: "Denari engagement", status: "requested", company: "Denari", requestType: "Paid Engagement", client: "Denari", paymentStatus: "unpaid", createdAt: now, updatedAt: now },
      { _id: "r6", type: "portfolio", title: "Infinite engagement", status: "requested", company: "Infinite", requestType: "Paid Engagement", client: "Infinite", paymentStatus: "unpaid", createdAt: now, updatedAt: now },
      { _id: "r7", type: "portfolio", title: "USDAI engagement", status: "requested", company: "USDAI", requestType: "Paid Engagement", client: "USDAI", paymentStatus: "unpaid", createdAt: now, updatedAt: now },
    ];
    persist();
  }
}

// Initialize
load();
seedIfEmpty();
persist();
fetchRemoteData();

/* ─── React hooks ─── */
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useItems(type?: ContentItem["type"]): ContentItem[] {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(type ? items.filter((i) => i.type === type) : items));
  return JSON.parse(snapshot);
}

export function useMembers(): TeamMember[] {
  return useSyncExternalStore(subscribe, () => members, () => members);
}

export function useCheckins(): Checkin[] {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(checkins));
  return JSON.parse(snapshot);
}

export function useCheckinsByDate(date: string): Checkin[] {
  const all = useCheckins();
  return all.filter((c) => c.date === date).sort((a, b) => a.hour - b.hour);
}

export function useCheckinDates(): string[] {
  const all = useCheckins();
  const dates = [...new Set(all.map((c) => c.date))].sort().reverse();
  return dates;
}

export function useStats() {
  const all = useItems();
  const now = Date.now();
  const weekEnd = now + 7 * 86400000;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const active = all.filter((i) => i.status !== "published" && i.status !== "delivered");
  const overdue = all.filter((i) => i.dueDate && i.dueDate < now && i.status !== "published" && i.status !== "delivered");
  const dueThisWeek = all.filter((i) => i.dueDate && i.dueDate >= now && i.dueDate <= weekEnd && i.status !== "published");
  const publishedThisMonth = all.filter((i) => (i.status === "published" || i.status === "delivered") && i.updatedAt >= monthStart.getTime());
  const byType: Record<string, number> = {};
  const workload: Record<string, number> = {};
  active.forEach((i) => {
    byType[i.type] = (byType[i.type] || 0) + 1;
    if (i.assignee) workload[i.assignee] = (workload[i.assignee] || 0) + 1;
  });
  return { totalActive: active.length, overdueCount: overdue.length, dueThisWeek: dueThisWeek.length, publishedThisMonth: publishedThisMonth.length, byType, workload };
}

export function useOverdue(): ContentItem[] {
  const all = useItems();
  return all.filter((i) => i.dueDate && i.dueDate < Date.now() && i.status !== "published" && i.status !== "delivered");
}

export function useUpcoming(days: number): ContentItem[] {
  const all = useItems();
  const now = Date.now();
  const end = now + days * 86400000;
  return all.filter((i) => i.dueDate && i.dueDate >= now && i.dueDate <= end && i.status !== "published" && i.status !== "delivered");
}

/* ─── Mutations ─── */
export function createItem(data: Omit<ContentItem, "_id" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const newItem = { ...data, _id: "i_" + Math.random().toString(36).slice(2, 10), createdAt: now, updatedAt: now } as ContentItem;
  if (!newItem.activity) newItem.activity = [];
  newItem.activity.push({ ts: now, text: "Created", by: data.createdBy || undefined });
  items = [...items, newItem];
  persist(); emit();
}

export function updateItem(id: string, data: Partial<ContentItem>) {
  items = items.map((i) => {
    if (i._id !== id) return i;
    const updated = { ...i, ...data, updatedAt: Date.now() };
    return updated;
  });
  persist(); emit();
}

export function addActivity(id: string, text: string, by?: string) {
  items = items.map((i) => {
    if (i._id !== id) return i;
    const activity = [...(i.activity || []), { ts: Date.now(), text, by }];
    return { ...i, activity, updatedAt: Date.now() };
  });
  persist(); emit();
}

export function updateStatus(id: string, status: string) {
  items = items.map((i) => {
    if (i._id !== id) return i;
    const activity = [...(i.activity || []), { ts: Date.now(), text: `Status → ${status}` }];
    return { ...i, status, activity, updatedAt: Date.now() };
  });
  persist(); emit();
}

export function setHandoff(id: string, waitingOn: string, note?: string) {
  items = items.map((i) => {
    if (i._id !== id) return i;
    const activity = [...(i.activity || []), { ts: Date.now(), text: `Handed off → waiting on ${waitingOn}${note ? ": " + note : ""}` }];
    return { ...i, waitingOn, handoffNote: note, handoffAt: Date.now(), activity, updatedAt: Date.now() };
  });
  persist(); emit();
}

export function removeItem(id: string) {
  items = items.filter((i) => i._id !== id);
  persist(); emit();
}

/* ─── Export for Viktor sync ─── */
export function exportData() {
  return { version: dataVersion, items, members, exportedAt: Date.now() };
}

export function importData(data: { items: ContentItem[]; members?: TeamMember[]; checkins?: Checkin[]; version?: number }) {
  items = data.items;
  if (data.members) members = data.members;
  if (data.checkins) checkins = data.checkins;
  if (data.version) dataVersion = data.version;
  persist(); emit();
}

export function exportCheckins() { return checkins; }
