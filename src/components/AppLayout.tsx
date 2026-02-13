import { useState } from "react";
import { Dashboard } from "../pages/Dashboard";
import { TwitterBoard } from "../pages/TwitterBoard";
import { EditorialCalendar } from "../pages/EditorialCalendar";
import { TTDCalendar } from "../pages/TTDCalendar";
import { PodcastTracker } from "../pages/PodcastTracker";
import { PortfolioRequests } from "../pages/PortfolioRequests";
import { BoardView } from "../pages/BoardView";
import { CalendarView } from "../pages/CalendarView";
import {
  LayoutDashboard,
  Twitter,
  FileText,
  Newspaper,
  Mic,
  Briefcase,
  Columns3,
  CalendarDays,
  Menu,
  X,
  Search,
} from "lucide-react";
import { useItems } from "../store";

type Page = "dashboard" | "board" | "calendar" | "twitter" | "editorial" | "ttd" | "podcast" | "portfolio";

const navItems: { id: Page; label: string; shortLabel: string; icon: React.ReactNode; separator?: boolean }[] = [
  { id: "dashboard", label: "Dashboard", shortLabel: "Home", icon: <LayoutDashboard size={16} /> },
  { id: "board", label: "Board", shortLabel: "Board", icon: <Columns3 size={16} /> },
  { id: "calendar", label: "Calendar", shortLabel: "Calendar", icon: <CalendarDays size={16} />, separator: true },
  { id: "twitter", label: "Twitter", shortLabel: "Twitter", icon: <Twitter size={16} /> },
  { id: "editorial", label: "Editorial", shortLabel: "Editorial", icon: <FileText size={16} /> },
  { id: "ttd", label: "TokenDispatch", shortLabel: "TTD", icon: <Newspaper size={16} /> },
  { id: "podcast", label: "Podcast", shortLabel: "Podcast", icon: <Mic size={16} /> },
  { id: "portfolio", label: "Portfolio", shortLabel: "Portfolio", icon: <Briefcase size={16} /> },
];

export function AppLayout() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const allItems = useItems();

  const searchResults = searchQuery.trim().length > 1
    ? allItems.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.assignee?.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard onNavigate={setCurrentPage} />;
      case "board": return <BoardView />;
      case "calendar": return <CalendarView />;
      case "twitter": return <TwitterBoard />;
      case "editorial": return <EditorialCalendar />;
      case "ttd": return <TTDCalendar />;
      case "podcast": return <PodcastTracker />;
      case "portfolio": return <PortfolioRequests />;
    }
  };

  const typeLabels: Record<string, string> = { twitter: "Twitter", editorial: "Editorial", ttd: "TTD", podcast: "Podcast", portfolio: "Portfolio" };
  const typePages: Record<string, Page> = { twitter: "twitter", editorial: "editorial", ttd: "ttd", podcast: "podcast", portfolio: "portfolio" };

  return (
    <div className="min-h-screen bg-white flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/10 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-52 bg-gray-50/80 border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-12 px-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">D</span>
            </div>
            <span className="text-[13px] font-semibold text-gray-900 tracking-tight">Content Hub</span>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all ${
                  currentPage === item.id
                    ? "bg-white text-gray-900 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-gray-100"
                    : "text-gray-500 hover:text-gray-700 hover:bg-white/60 border border-transparent"
                }`}
              >
                <span className={currentPage === item.id ? "text-gray-700" : "text-gray-400"}>{item.icon}</span>
                {item.label}
              </button>
              {item.separator && <div className="my-2 mx-2.5 border-t border-gray-100" />}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 font-medium tracking-wider uppercase">decentralised.co</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-12 px-4 lg:px-6 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <Menu size={18} />
          </button>
          <h2 className="text-[13px] font-semibold text-gray-900">
            {navItems.find((n) => n.id === currentPage)?.label}
          </h2>
          <div className="flex-1" />
          
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-50 transition text-xs"
            >
              <Search size={14} />
              <span className="hidden sm:inline text-gray-300">Search…</span>
              <kbd className="hidden sm:inline text-[10px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded font-mono">/</kbd>
            </button>
            {searchOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
                <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles, tweets, episodes…"
                      className="w-full px-2.5 py-1.5 text-sm bg-gray-50 rounded-lg border-0 focus:outline-none focus:bg-gray-100 transition"
                      autoFocus
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-64 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => { setCurrentPage(typePages[item.type]); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition text-left"
                        >
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase w-14 text-center shrink-0">{typeLabels[item.type]}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-gray-900 truncate">{item.title}</div>
                            <div className="text-[11px] text-gray-400">{item.assignee || "Unassigned"} · {item.status}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery.trim().length > 1 && searchResults.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-400">No results</div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-gray-300 tabular-nums hidden sm:block">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-white">
          <div className="max-w-[1280px] mx-auto">{renderPage()}</div>
        </div>
      </main>
    </div>
  );
}
