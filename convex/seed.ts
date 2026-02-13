import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existingMembers = await ctx.db.query("teamMembers").collect();
    if (existingMembers.length === 0) {
      const members = [
        { name: "Joel", role: "Founder / Editor-in-Chief", email: "joel@decentralised.co", avatarColor: "#4f46e5" },
        { name: "Sid", role: "Co-founder / Venture", email: "sid@decentralised.co", avatarColor: "#7c3aed" },
        { name: "Saurabh", role: "Lead Researcher", email: "saurabh@decentralised.co", avatarColor: "#db2777" },
        { name: "Vaidik", role: "Staff Writer", email: "vaidik@decentralised.co", avatarColor: "#d97706" },
        { name: "Nishil", role: "Staff Writer", email: "nishil@decentralised.co", avatarColor: "#059669" },
        { name: "Ruwanthi", role: "Operations", email: "ruwanthi@decentralised.co", avatarColor: "#0891b2" },
        { name: "Sagar", role: "Video / Content", email: "sagar@decentralised.co", avatarColor: "#ea580c" },
        { name: "Anish", role: "Growth", email: "anish@decentralised.co", avatarColor: "#0d9488" },
        { name: "Soham", role: "Team", email: "soham@decentralised.co", avatarColor: "#9333ea" },
        { name: "Olivia", role: "Finance", email: "olivia@decentralised.co", avatarColor: "#e11d48" },
      ];
      for (const m of members) await ctx.db.insert("teamMembers", m);
    }

    const existingItems = await ctx.db.query("contentItems").collect();
    if (existingItems.length > 0) return null;

    const now = Date.now();
    const day = 86400000;

    const items = [
      // Twitter
      { type: "twitter" as const, title: "Virtuals ecosystem break down", status: "pitch", format: "thread", createdAt: now, updatedAt: now },
      { type: "twitter" as const, title: "Forms of capital formation in crypto", status: "pitch", format: "thread", createdAt: now, updatedAt: now },
      { type: "twitter" as const, title: "A note on capital formation in crypto", status: "pitch", format: "single", createdAt: now, updatedAt: now },
      { type: "twitter" as const, title: "What if metadao went permissionless", status: "pitch", format: "thread", createdAt: now, updatedAt: now },
      { type: "twitter" as const, title: "Virtuals Protocol analysis", status: "drafting", assignee: "Vaidik", format: "thread", createdAt: now, updatedAt: now },

      // Editorial — newsroom stages: pitch → assigned → drafting → review → copy_edit → ready → published
      { type: "editorial" as const, title: "ZkSync Thesis", status: "drafting", assignee: "Saurabh", dueDate: now - 24 * day, category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Semiliquid", status: "assigned", assignee: "Joel", dueDate: now - 18 * day, category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Holder rights", status: "assigned", assignee: "Joel", dueDate: now - 10 * day, category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Drift Thesis", status: "assigned", assignee: "Joel", dueDate: now - 9 * day, category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "LiFi", status: "review", assignee: "Saurabh", dueDate: now - 8 * day, category: "sponsored", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "LayerZero", status: "assigned", assignee: "Joel", dueDate: now - 4 * day, category: "sponsored", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Crypto revenue analysis", status: "drafting", assignee: "Saurabh", dueDate: now - 1 * day, category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Saffron", status: "assigned", assignee: "Saurabh", dueDate: now + 3 * day, category: "sponsored", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Ronin Deep Dive", status: "drafting", assignee: "Joel", category: "sponsored", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Gravity / ZkSync", status: "assigned", assignee: "Vaidik", category: "sponsored", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Futarchy", status: "pitch", assignee: "Joel", category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Ethena Thesis", status: "pitch", category: "organic", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Bebop", status: "pitch", assignee: "Joel", category: "collaboration", createdAt: now, updatedAt: now },
      { type: "editorial" as const, title: "Nox", status: "pitch", assignee: "Saurabh", category: "collaboration", createdAt: now, updatedAt: now },

      // TTD
      { type: "ttd" as const, title: "Trading uranium on-chain", status: "published", assignee: "Vaidik", dueDate: now - 12 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "Book review – The Bitcoin Standard", status: "published", assignee: "Nishil", dueDate: now - 11 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "Quants piece – on-chain lending", status: "published", assignee: "Saurabh", dueDate: now - 10 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "Hype's prediction markets", status: "published", assignee: "Nishil", dueDate: now - 9 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "AI agentic economy", status: "published", assignee: "Vaidik", dueDate: now - 5 * day, weekNumber: 6, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "DeFi yield strategies 2026", status: "drafting", assignee: "Vaidik", dueDate: now + 1 * day, weekNumber: 7, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "Stablecoin regulation update", status: "planned", assignee: "Nishil", dueDate: now + 2 * day, weekNumber: 7, createdAt: now, updatedAt: now },
      { type: "ttd" as const, title: "Bitcoin mining economics", status: "planned", assignee: "Saurabh", dueDate: now + 3 * day, weekNumber: 7, createdAt: now, updatedAt: now },

      // Podcast
      { type: "podcast" as const, title: "Philipp (LiFi)", status: "booked", assignee: "Saurabh", dueDate: now - 3 * day, guest: "Philipp Zentner", createdAt: now, updatedAt: now },
      { type: "podcast" as const, title: "Architect Protocol", status: "planned", assignee: "Saurabh", dueDate: now + 4 * day, guest: "TBD", createdAt: now, updatedAt: now },

      // Portfolio
      { type: "portfolio" as const, title: "Onchain assets article", status: "in_progress", assignee: "Nishil", company: "Portfolio Co", requestType: "Article", createdAt: now, updatedAt: now },
      { type: "portfolio" as const, title: "Aquanow write-up", status: "accepted", assignee: "Joel", company: "Aquanow", requestType: "Article", createdAt: now, updatedAt: now },
      { type: "portfolio" as const, title: "Gearbox engagement", status: "requested", company: "Gearbox", requestType: "Paid Engagement", createdAt: now, updatedAt: now },
      { type: "portfolio" as const, title: "Talus engagement", status: "requested", company: "Talus", requestType: "Paid Engagement", createdAt: now, updatedAt: now },
      { type: "portfolio" as const, title: "Denari engagement", status: "requested", company: "Denari", requestType: "Paid Engagement", createdAt: now, updatedAt: now },
    ];

    for (const item of items) await ctx.db.insert("contentItems", item);
    return null;
  },
});
