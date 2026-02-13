import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    return await ctx.db.query("teamMembers").collect();
  },
});

export const seed = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("teamMembers").collect();
    if (existing.length > 0) return null;

    const members = [
      { name: "Joel", role: "Founder", email: "joel@decentralised.co", avatarColor: "#6366f1" },
      { name: "Sid", role: "Co-founder / Venture", email: "sid@decentralised.co", avatarColor: "#8b5cf6" },
      { name: "Saurabh", role: "Lead Researcher", email: "saurabh@decentralised.co", avatarColor: "#ec4899" },
      { name: "Vaidik", role: "Research / Writing", email: "vaidik@decentralised.co", avatarColor: "#f59e0b" },
      { name: "Nishil", role: "Research / Writing", email: "nishil@decentralised.co", avatarColor: "#10b981" },
      { name: "Ruwanthi", role: "Operations", email: "ruwanthi@decentralised.co", avatarColor: "#06b6d4" },
      { name: "Sagar", role: "Video / Content", email: "sagar@decentralised.co", avatarColor: "#f97316" },
      { name: "Anish", role: "Ads / Growth", email: "anish@decentralised.co", avatarColor: "#14b8a6" },
      { name: "Soham", role: "Team", email: "soham@decentralised.co", avatarColor: "#a855f7" },
      { name: "Olivia", role: "Finance", email: "olivia@decentralised.co", avatarColor: "#e11d48" },
    ];

    for (const member of members) {
      await ctx.db.insert("teamMembers", member);
    }
    return null;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    email: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
  },
  returns: v.id("teamMembers"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("teamMembers", args);
  },
});
