import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import { useUiStore } from '@store/uiStore';
import { ROUTES } from '@config/routes';

export function SuperAdminSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const navItems = [
    {
      label: 'Dashboard',
      href:  ROUTES.SUPER_ADMIN.DASHBOARD,
      icon:  LayoutDashboard,
    },
    {
      label: 'Admin Management',
      href:  ROUTES.SUPER_ADMIN.ADMINS,
      icon:  Users,
    },
    {
      label: 'Institutes / Branches',
      href:  ROUTES.SUPER_ADMIN.BRANCHES,
      icon:  Building2,
    },
    {
      label: 'Audit & System Logs',
      href:  ROUTES.SUPER_ADMIN.LOGS,
      icon:  FileText,
    },
    {
      label: 'Global Settings',
      href:  ROUTES.SUPER_ADMIN.SETTINGS,
      icon:  Settings,
    },
  ];

  return (
    <aside
      aria-label="Super Admin navigation"
      className={cn(
        'relative flex h-screen flex-col border-r bg-slate-950 text-slate-100 transition-[width] duration-300 ease-in-out shadow-xl',
        sidebarCollapsed
          ? 'w-[var(--sidebar-collapsed-width)]'
          : 'w-[var(--sidebar-width)]',
      )}
    >
      {/* Brand Header */}
      <div className="flex h-[var(--topbar-height)] items-center px-4 overflow-hidden border-b border-slate-800">
        <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        {!sidebarCollapsed && (
          <div className="ml-3 truncate">
            <span className="text-base font-bold tracking-tight text-white block">AcademiaX</span>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest block">
              Super Admin Console
            </span>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
                  sidebarCollapsed && 'justify-center px-0',
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* Collapse toggle */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full text-slate-400 hover:text-white hover:bg-slate-900"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </aside>
  );
}
