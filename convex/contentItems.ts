import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Queries ──────────────────────────────────────────────

export const listByType = query({
  args: {
    type: v.union(
      v.literal("twitter"),
      v.literal("editorial"),
      v.literal("ttd"),
      v.literal("podcast"),
      v.literal("portfolio")
    ),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { type }) => {
    return await ctx.db
      .query("contentItems")
      .withIndex("by_type", (q) => q.eq("type", type))
      .collect();
  },
});

export const listByTypeAndStatus = query({
  args: {
    type: v.string(),
    status: v.string(),
  },
  returns: v.array(v.any()),
  handler: async (ctx, { type, status }) => {
    return await ctx.db
      .query("contentItems")
      .withIndex("by_type_status", (q) => q.eq("type", type as any).eq("status", status))
      .collect();
  },
});

export const listOverdue = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const now = Date.now();
    const allItems = await ctx.db.query("contentItems").collect();
    return allItems.filter(
      (item) =>
        item.dueDate &&
        item.dueDate < now &&
        item.status !== "published" &&
        item.status !== "delivered" &&
        item.status !== "completed"
    );
  },
});

export const listUpcoming = query({
  args: { days: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, { days }) => {
    const now = Date.now();
    const daysAhead = days ?? 7;
    const futureLimit = now + daysAhead * 24 * 60 * 60 * 1000;
    const allItems = await ctx.db.query("contentItems").collect();
    return allItems.filter(
      (item) =>
        item.dueDate &&
        item.dueDate >= now &&
        item.dueDate <= futureLimit &&
        item.status !== "published" &&
        item.status !== "delivered" &&
        item.status !== "completed"
    );
  },
});

export const getStats = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const now = Date.now();
    const allItems = await ctx.db.query("contentItems").collect();

    const active = allItems.filter(
      (i) => i.status !== "published" && i.status !== "delivered" && i.status !== "completed"
    );
    const overdue = active.filter((i) => i.dueDate && i.dueDate < now);
    const thisWeek = active.filter(
      (i) => i.dueDate && i.dueDate >= now && i.dueDate <= now + 7 * 24 * 60 * 60 * 1000
    );

    const publishedThisMonth = allItems.filter((i) => {
      if (i.status !== "published" && i.status !== "delivered") return false;
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      return i.updatedAt >= monthStart.getTime();
    });

    // Workload by assignee
    const workload: Record<string, number> = {};
    active.forEach((item) => {
      const assignee = item.assignee || "Unassigned";
      workload[assignee] = (workload[assignee] || 0) + 1;
    });

    // Counts by type
    const byType: Record<string, number> = {};
    active.forEach((item) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    return {
      totalActive: active.length,
      overdueCount: overdue.length,
      dueThisWeek: thisWeek.length,
      publishedThisMonth: publishedThisMonth.length,
      workload,
      byType,
    };
  },
});

export const getById = query({
  args: { id: v.id("contentItems") },
  returns: v.any(),
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// ─── Mutations ────────────────────────────────────────────

export const create = mutation({
  args: {
    type: v.union(
      v.literal("twitter"),
      v.literal("editorial"),
      v.literal("ttd"),
      v.literal("podcast"),
      v.literal("portfolio")
    ),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.string(),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    format: v.optional(v.string()),
    guest: v.optional(v.string()),
    company: v.optional(v.string()),
    requestType: v.optional(v.string()),
    weekNumber: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.string()),
  },
  returns: v.id("contentItems"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("contentItems", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contentItems"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    assignee: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    category: v.optional(v.string()),
    format: v.optional(v.string()),
    guest: v.optional(v.string()),
    company: v.optional(v.string()),
    requestType: v.optional(v.string()),
    weekNumber: v.optional(v.number()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { id, ...fields }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Item not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("contentItems"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("contentItems") },
  returns: v.null(),
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return null;
  },
});
