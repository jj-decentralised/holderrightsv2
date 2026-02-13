import { useState } from "react";
import { Dashboard } from "../pages/Dashboard";
import { TwitterBoard } from "../pages/TwitterBoard";
import { EditorialCalendar } from "../pages/EditorialCalendar";
import { TTDCalendar } from "../pages/TTDCalendar";
import { PodcastTracker } from "../pages/PodcastTracker";
import { PortfolioRequests } from "../pages/PortfolioRequests";
import {
  LayoutDashboard,
  Twitter,
  FileText,
  Newspaper,
  Mic,
  Briefcase,
  Menu,
  X,
} from "lucide-react";

type Page = "dashboard" | "twitter" | "editorial" | "ttd" | "podcast" | "portfolio";

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "twitter", label: "Twitter", icon: <Twitter size={18} /> },
  { id: "editorial", label: "Editorial", icon: <FileText size={18} /> },
  { id: "ttd", label: "TokenDispatch", icon: <Newspaper size={18} /> },
  { id: "podcast", label: "Podcast", icon: <Mic size={18} /> },
  { id: "portfolio", label: "Portfolio", icon: <Briefcase size={18} /> },
];

export function AppLayout() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard onNavigate={setCurrentPage} />;
      case "twitter": return <TwitterBoard />;
      case "editorial": return <EditorialCalendar />;
      case "ttd": return <TTDCalendar />;
      case "podcast": return <PodcastTracker />;
      case "portfolio": return <PortfolioRequests />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 px-5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight text-gray-900">Content Hub</span>
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                currentPage === item.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 text-center">decentralised.co</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 px-4 lg:px-8 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <Menu size={20} />
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {navItems.find((n) => n.id === currentPage)?.label}
          </h2>
        </header>
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto">{renderPage()}</div>
        </div>
      </main>
    </div>
  );
}
