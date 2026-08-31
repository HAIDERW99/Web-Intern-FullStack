import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  CalendarDays,
  Layers,
  BookOpen,
  Users,
  Briefcase,
  AlertOctagon,
  FileSpreadsheet,
  HelpCircle,
  Clock,
  Sparkles,
  Activity
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    currentUser,
    conflicts,
    unallocatedCourses,
  } = useApp();

  // Dynamic badge counts (real-time from global context)
  const activeConflictsCount = (conflicts || []).filter(c => c.status !== 'resolved').length;
  const unassignedCount = (unallocatedCourses || []).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Command Centre',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'planning',
      label: 'Planning',
      sublabel: 'Sessions & Offerings',
      icon: CalendarDays,
    },
    {
      id: 'allocations',
      label: 'Course Allocation',
      sublabel: 'Matrix & Section Grid',
      icon: Layers,
      highlight: true,
    },
    {
      id: 'courses',
      label: 'Courses',
      sublabel: 'Catalog & Credits',
      icon: BookOpen,
    },
    {
      id: 'faculty',
      label: 'Faculty',
      sublabel: 'Permanent Directory',
      icon: Users,
    },
    {
      id: 'visiting',
      label: 'Visiting Faculty',
      sublabel: 'Contracts & Rates',
      icon: Briefcase,
    },
    {
      id: 'remaining',
      label: 'Remaining Courses',
      sublabel: 'Unassigned Sections',
      icon: Clock,
      badge: unassignedCount > 0 ? `${unassignedCount} unassigned` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'conflicts',
      label: 'Conflict Centre',
      sublabel: 'Policy Violations',
      icon: AlertOctagon,
      badge: activeConflictsCount > 0 ? `${activeConflictsCount} issue${activeConflictsCount === 1 ? '' : 's'}` : null,
      badgeColor: 'bg-red-100 text-red-700',
    },
    {
      id: 'activity-log',
      label: 'Activity Log',
      sublabel: 'Audit History',
      icon: Activity,
    },
    {
      id: 'import-export',
      label: 'Import / Export',
      sublabel: 'Excel & Reports',
      icon: FileSpreadsheet,
    },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-[57px] bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-academic-600 text-white shadow-sm font-semibold'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}
                  />
                  <div className="text-left">
                    <div className="leading-none">{item.label}</div>
                    <div className={`text-[11px] mt-0.5 ${isActive ? 'text-academic-100' : 'text-slate-400'}`}>
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badgeColor || 'bg-academic-100 text-academic-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Scope / Info Box */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-subtle text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5 text-academic-700">
                <Sparkles size={13} />
                <span>AI Recommendation</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Multi-factor matching active for Fall 2025 allocations.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
