import React from 'react';
import {
  LayoutDashboard, BarChart3, Table2, Upload, Settings,
  ChevronLeft, ChevronRight, Activity, X,
} from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';
import type { PageId } from '../../types';
import { clsx } from '../../utils';

const NAV_ITEMS: { id: PageId; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics',  icon: BarChart3 },
  { id: 'data',      label: 'Data Table', icon: Table2 },
  { id: 'upload',    label: 'Upload',     icon: Upload },
  { id: 'settings',  label: 'Settings',   icon: Settings },
];

const Sidebar: React.FC = () => {
  const { activePage, sidebarOpen, setActivePage, toggleSidebar, setSidebarOpen } = useDashboardStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 z-30 h-full flex flex-col transition-all duration-300 ease-in-out',
          'bg-purple-50 border-r border-purple-100',
          sidebarOpen ? 'w-64' : 'w-16',
          'lg:relative lg:z-auto'
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 border-b border-purple-100 px-4 flex-shrink-0',
          sidebarOpen ? 'justify-between' : 'justify-center'
        )}>
          <div className={clsx('flex items-center gap-2', !sidebarOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-lg bg-purple-200 flex items-center justify-center flex-shrink-0 shadow-sm shadow-purple-200/50">
              <Activity size={16} className="text-black" />
            </div>
            {sidebarOpen && (
              <div>
                <span className="text-black font-bold text-sm leading-none">DataPulse</span>
                <p className="text-black text-[10px] leading-none mt-0.5">Analytics</p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-md text-black hover:text-black hover:bg-purple-100 transition-colors lg:flex hidden"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md text-black hover:text-black hover:bg-purple-100 transition-colors lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center p-2 rounded-md text-black hover:text-black hover:bg-purple-100 transition-colors mb-2"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          )}

          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-purple-200 text-black shadow-sm'
                    : 'text-slate-800 hover:text-black hover:bg-purple-100',
                  !sidebarOpen && 'justify-center px-2'
                )}
                title={!sidebarOpen ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-purple-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-xs text-black font-bold">
                A
              </div>
              <div className="min-w-0">
                <p className="text-black text-xs font-medium truncate">Admin User</p>
                <p className="text-black text-[10px] truncate">admin@datapulse.io</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;



