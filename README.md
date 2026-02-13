# DCo Content Hub

Unified content management app for [Decentralised.co](https://decentralised.co) — manage your Twitter pipeline, editorial calendar, TokenDispatch, podcast, and portfolio requests in one place.

## Features

- **📊 Dashboard** — At-a-glance view: overdue items, due this week, published count, writer workload
- **🐦 Twitter Board** — Kanban board for tweet/thread ideas (Idea → Drafting → Review → Published)
- **📅 Editorial Calendar** — List + calendar view with color-coded content types (organic, paid, collab, research)
- **📰 TokenDispatch** — Weekly content calendar with daily articles and progress tracking
- **🎙️ Podcast** — Episode pipeline (Planned → Booked → Recorded → Editing → Published)
- **💼 Portfolio Requests** — Track content requests from portfolio companies

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **Backend**: [Convex](https://convex.dev) (real-time database + serverless functions)
- **Auth**: Email/password via `@convex-dev/auth`
- **Icons**: Lucide React

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This will prompt you to create a Convex project and set up your `.env.local` with the Convex URL.

### 3. Start development

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Vite frontend
npm run dev
```

### 4. Seed data

The app auto-seeds team members and sample content items on first load. Edit `convex/seed.ts` to customize.

## Project Structure

```
├── convex/                  # Backend
│   ├── schema.ts           # Database schema
│   ├── contentItems.ts     # Content CRUD + queries
│   ├── teamMembers.ts      # Team member management
│   ├── seed.ts             # Sample data seeder
│   ├── auth.ts             # Auth configuration
│   └── auth.config.ts      # Auth providers
├── src/                     # Frontend
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   ├── index.css           # Global styles
│   ├── components/
│   │   ├── AppLayout.tsx   # Sidebar navigation
│   │   └── SignInForm.tsx  # Auth form
│   └── pages/
│       ├── Dashboard.tsx        # Overview dashboard
│       ├── TwitterBoard.tsx     # Kanban board
│       ├── EditorialCalendar.tsx # Calendar + list view
│       ├── TTDCalendar.tsx      # Weekly content calendar
│       ├── PodcastTracker.tsx   # Episode tracker
│       └── PortfolioRequests.tsx # Request pipeline
└── scripts/
    └── content-hub-test.ts # E2E test
```

## Content Types & Statuses

| Type | Statuses |
|------|----------|
| Twitter | idea → drafting → review → published |
| Editorial | idea → assigned → drafting → review → published |
| TTD | planned → drafting → published |
| Podcast | planned → booked → recorded → editing → published |
| Portfolio | requested → accepted → in_progress → delivered |

## Team

Pre-loaded with the DCo team. Edit `convex/seed.ts` to update members.

---

Built by [Viktor AI](https://getviktor.com) 🤖
