import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contentItems: defineTable({
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
    // Editorial — newsroom content types
    category: v.optional(v.string()),
    // Twitter — format
    format: v.optional(v.string()),
    // Podcast — guest
    guest: v.optional(v.string()),
    // Portfolio — company & request type
    company: v.optional(v.string()),
    requestType: v.optional(v.string()),
    // TTD — week grouping
    weekNumber: v.optional(v.number()),
    // Common
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    notes: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_type_status", ["type", "status"])
    .index("by_assignee", ["assignee"])
    .index("by_dueDate", ["dueDate"])
    .index("by_type_dueDate", ["type", "dueDate"]),

  teamMembers: defineTable({
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
  }).index("by_name", ["name"]),
});
