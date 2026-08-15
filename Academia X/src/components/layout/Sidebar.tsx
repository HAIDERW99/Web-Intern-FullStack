import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { cn } from '@lib/utils';
import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';
import { useUiStore } from '@store/uiStore';
import { useAuthStore } from '@store/authStore';
import { MENU_ITEMS } from '@config/menuItems';
import { APP_NAME } from '@config/constants';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { user } = useAuthStore();

  // Filter menu items by the user's role
  const visibleItems = MENU_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        'relative flex h-screen flex-col border-r bg-card transition-[width] duration-300 ease-in-out',
        sidebarCollapsed
          ? 'w-[var(--sidebar-collapsed-width)]'
          : 'w-[var(--sidebar-width)]',
      )}
    >
      {/* Logo */}
      <div className="flex h-[var(--topbar-height)] items-center px-4 overflow-hidden">
        <GraduationCap className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        {!sidebarCollapsed && (
          <span className="ml-3 text-lg font-bold tracking-tight truncate">{APP_NAME}</span>
        )}
      </div>

      <Separator />

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
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

      <Separator />

      {/* Collapse toggle */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full"
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
