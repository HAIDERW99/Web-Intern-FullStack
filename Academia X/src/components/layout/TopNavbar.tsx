import { Bell, LogOut, Moon, Sun, User } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Separator } from '@components/ui/separator';
import { Badge } from '@components/ui/badge';
import { useTheme } from '@context/ThemeProvider';
import { useAuth } from '@hooks/useAuth';
import { getInitials } from '@lib/utils';

export function TopNavbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <header
      className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6"
      role="banner"
    >
      {/* Left — can hold breadcrumbs or page title */}
      <div className="flex items-center gap-2">
        {user && (
          <Badge variant="outline" className="capitalize">
            {user.role}
          </Badge>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        {/* Notifications (placeholder) */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name} />
            <AvatarFallback className="text-xs">
              {user ? getInitials(user.full_name) : <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          {user && (
            <div className="hidden md:block text-sm leading-tight">
              <p className="font-medium truncate max-w-[140px]">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
