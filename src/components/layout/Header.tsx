import React from 'react';
import { Menu, RefreshCw, Bell, Search } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import { useGoogleSheets } from '../../hooks/useGoogleSheets';
import { clsx } from '../../utils';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard',   subtitle: 'Overview of key metrics' },
  analytics: { title: 'Analytics',   subtitle: 'Deep-dive into your data' },
  data:      { title: 'Data Table',  subtitle: 'Browse and search all records' },
  upload:    { title: 'Upload Data', subtitle: 'Import CSV and Excel files' },
  settings:  { title: 'Settings',    subtitle: 'Configure integrations' },
};

const Header: React.FC = () => {
  const { activePage, setSidebarOpen, sidebarOpen, setFilters, filters } = useDashboardStore();
  const { refetch, sheetsLoading } = useGoogleSheets();
  const pageInfo = PAGE_TITLES[activePage] ?? PAGE_TITLES.dashboard;

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 bg-white backdrop-blur-md flex-shrink-0 sticky top-0 z-10">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-600 hover:text-black hover:bg-slate-100 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-black font-semibold text-base leading-none">{pageInfo.title}</h1>
          <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-2">
        {/* Global search bar */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search records..."
            value={filters.searchQuery}
            onChange={e => setFilters({ searchQuery: e.target.value })}
            className="pl-8 pr-4 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-48 transition-all"
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={refetch}
          disabled={sheetsLoading === 'loading'}
          className="p-2 rounded-lg text-slate-600 hover:text-black hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="Refresh Google Sheets data"
        >
          <RefreshCw
            size={17}
            className={clsx(sheetsLoading === 'loading' && 'animate-spin')}
          />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-slate-600 hover:text-black hover:bg-slate-100 transition-colors relative">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-200" />
        </button>
      </div>
    </header>
  );
};

export default Header;



