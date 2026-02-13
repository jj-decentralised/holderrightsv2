import { useSyncExternalStore } from "react";

/* ─── Types ─── */
export type ArtStatus = "none" | "needs_art" | "art_requested" | "art_in_progress" | "art_review" | "art_done";

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
  /* Art / Creative tracking */
  artStatus?: ArtStatus;
  artAssignee?: string;
  artNotes?: string;
  artDueDate?: number;
  createdAt: number;
  updatedAt: number;
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
let listeners = new Set<() => void>();
let dataVersion = 0; // Increments on every change for snapshot tracking

function emit() { dataVersion++; listeners.forEach((l) => l()); }

function persist() {
  localStorage.setItem("dco_items", JSON.stringify(items));
  localStorage.setItem("dco_members", JSON.stringify(members));
  localStorage.setItem("dco_version", String(dataVersion));
}

function load() {
  try {
    const i = localStorage.getItem("dco_items");
    const m = localStorage.getItem("dco_members");
    if (i) items = JSON.parse(i);
    if (m) members = JSON.parse(m);
  } catch {}
}

/* ─── Remote data sync ─── */
async function fetchRemoteData() {
  try {
    const resp = await fetch("/data.json?t=" + Date.now());
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.items && Array.isArray(data.items)) {
      const localVersion = localStorage.getItem("dco_version") || "0";
      const remoteVersion = String(data.version || 0);
      // Remote wins if version is newer or local has no edits
      if (Number(remoteVersion) >= Number(localVersion) || items.length === 0) {
        items = data.items;
        if (data.members) members = data.members;
        dataVersion = Number(remoteVersion);
        persist();
        emit();
      }
    }
  } catch {
    // Silently fail — localStorage is the fallback
  }
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
    ];
  }
  if (items.length === 0) {
    const now = Date.now();
    const day = 86400000;
    items = [
      // Twitter
      { _id: "t1", type: "twitter", title: "Virtuals ecosystem breakdown", status: "pitch", format: "thread", createdAt: now, updatedAt: now },
      { _id: "t2", type: "twitter", title: "Forms of capital formation in crypto", status: "pitch", format: "thread", createdAt: now, updatedAt: now },
      { _id: "t3", type: "twitter", title: "A note on capital formation in crypto", status: "pitch", format: "single", createdAt: now, updatedAt: now },
      { _id: "t4", type: "twitter", title: "What if MetaDAO went permissionless", status: "pitch", format: "thread", createdAt: now, updatedAt: now },
      { _id: "t5", type: "twitter", title: "Virtuals Protocol analysis", status: "drafting", assignee: "Vaidik", format: "thread", createdAt: now, updatedAt: now },

      // Editorial
      { _id: "e1", type: "editorial", title: "ZkSync Thesis", status: "drafting", assignee: "Saurabh", dueDate: now - 24 * day, category: "organic", createdAt: now, updatedAt: now - 20 * day },
      { _id: "e2", type: "editorial", title: "Semiliquid", status: "assigned", assignee: "Joel", dueDate: now - 18 * day, category: "organic", createdAt: now, updatedAt: now - 15 * day },
      { _id: "e3", type: "editorial", title: "Holder Rights", status: "assigned", assignee: "Joel", dueDate: now - 10 * day, category: "organic", createdAt: now, updatedAt: now - 8 * day },
      { _id: "e4", type: "editorial", title: "Drift Thesis", status: "assigned", assignee: "Joel", dueDate: now - 9 * day, category: "organic", createdAt: now, updatedAt: now - 7 * day },
      { _id: "e5", type: "editorial", title: "LiFi", status: "review", assignee: "Saurabh", dueDate: now - 8 * day, category: "sponsored", artStatus: "art_in_progress" as ArtStatus, artAssignee: "Andres", artNotes: "Cover art + 3 inline graphics", createdAt: now, updatedAt: now - 5 * day },
      { _id: "e6", type: "editorial", title: "LayerZero", status: "assigned", assignee: "Joel", dueDate: now - 4 * day, category: "sponsored", artStatus: "needs_art" as ArtStatus, artNotes: "Need cover image, brand kit shared in #art-lifi", createdAt: now, updatedAt: now - 3 * day },
      { _id: "e7", type: "editorial", title: "Crypto revenue analysis", status: "drafting", assignee: "Saurabh", dueDate: now - 1 * day, category: "organic", createdAt: now, updatedAt: now - 1 * day },
      { _id: "e8", type: "editorial", title: "Saffron", status: "assigned", assignee: "Saurabh", dueDate: now + 3 * day, category: "sponsored", artStatus: "art_requested" as ArtStatus, artAssignee: "Andres", artDueDate: now + 2 * day, createdAt: now, updatedAt: now },
      { _id: "e9", type: "editorial", title: "Ronin Deep Dive", status: "drafting", assignee: "Joel", category: "sponsored", artStatus: "art_done" as ArtStatus, artAssignee: "Andres", createdAt: now, updatedAt: now - 10 * day },
      { _id: "e10", type: "editorial", title: "Gravity / ZkSync", status: "assigned", assignee: "Vaidik", category: "sponsored", artStatus: "needs_art" as ArtStatus, createdAt: now, updatedAt: now },
      { _id: "e11", type: "editorial", title: "Futarchy", status: "pitch", assignee: "Joel", category: "organic", createdAt: now, updatedAt: now },
      { _id: "e12", type: "editorial", title: "Ethena Thesis", status: "pitch", category: "organic", createdAt: now, updatedAt: now },
      { _id: "e13", type: "editorial", title: "Bebop", status: "pitch", assignee: "Joel", category: "collaboration", createdAt: now, updatedAt: now },
      { _id: "e14", type: "editorial", title: "Nox", status: "pitch", assignee: "Saurabh", category: "collaboration", createdAt: now, updatedAt: now },

      // TTD
      { _id: "d1", type: "ttd", title: "Trading uranium on-chain", status: "published", assignee: "Vaidik", dueDate: now - 12 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { _id: "d2", type: "ttd", title: "Book review – The Bitcoin Standard", status: "published", assignee: "Nishil", dueDate: now - 11 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { _id: "d3", type: "ttd", title: "Quants piece – on-chain lending", status: "published", assignee: "Saurabh", dueDate: now - 10 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { _id: "d4", type: "ttd", title: "Hype's prediction markets", status: "published", assignee: "Nishil", dueDate: now - 9 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { _id: "d5", type: "ttd", title: "AI agentic economy", status: "published", assignee: "Vaidik", dueDate: now - 5 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { _id: "d6", type: "ttd", title: "DeFi yield strategies 2026", status: "drafting", assignee: "Vaidik", dueDate: now + 1 * day, weekNumber: 7, createdAt: now, updatedAt: now },
      { _id: "d7", type: "ttd", title: "Stablecoin regulation update", status: "planned", assignee: "Nishil", dueDate: now + 2 * day, weekNumber: 7, createdAt: now, updatedAt: now },
      { _id: "d8", type: "ttd", title: "Bitcoin mining economics", status: "planned", assignee: "Saurabh", dueDate: now + 3 * day, weekNumber: 7, createdAt: now, updatedAt: now },

      // Podcast
      { _id: "p1", type: "podcast", title: "Philipp (LiFi)", status: "booked", assignee: "Saurabh", dueDate: now - 3 * day, guest: "Philipp Zentner", createdAt: now, updatedAt: now },
      { _id: "p2", type: "podcast", title: "Architect Protocol", status: "planned", assignee: "Saurabh", dueDate: now + 4 * day, guest: "TBD", createdAt: now, updatedAt: now },

      // Portfolio
      { _id: "r1", type: "portfolio", title: "Onchain assets article", status: "in_progress", assignee: "Nishil", company: "Portfolio Co", requestType: "Article", createdAt: now, updatedAt: now },
      { _id: "r2", type: "portfolio", title: "Aquanow write-up", status: "accepted", assignee: "Joel", company: "Aquanow", requestType: "Article", createdAt: now, updatedAt: now },
      { _id: "r3", type: "portfolio", title: "Gearbox engagement", status: "requested", company: "Gearbox", requestType: "Paid Engagement", createdAt: now, updatedAt: now },
      { _id: "r4", type: "portfolio", title: "Talus engagement", status: "requested", company: "Talus", requestType: "Paid Engagement", createdAt: now, updatedAt: now },
      { _id: "r5", type: "portfolio", title: "Denari engagement", status: "requested", company: "Denari", requestType: "Paid Engagement", createdAt: now, updatedAt: now },
    ];
    persist();
  }
}

// Initialize
load();
seedIfEmpty();
persist();
// Try to fetch remote data (non-blocking)
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
  items = [...items, { ...data, _id: "i_" + Math.random().toString(36).slice(2, 10), createdAt: now, updatedAt: now } as ContentItem];
  persist(); emit();
}

export function updateItem(id: string, data: Partial<ContentItem>) {
  items = items.map((i) => i._id === id ? { ...i, ...data, updatedAt: Date.now() } : i);
  persist(); emit();
}

export function updateStatus(id: string, status: string) {
  items = items.map((i) => i._id === id ? { ...i, status, updatedAt: Date.now() } : i);
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

export function importData(data: { items: ContentItem[]; members?: TeamMember[]; version?: number }) {
  items = data.items;
  if (data.members) members = data.members;
  if (data.version) dataVersion = data.version;
  persist(); emit();
}
