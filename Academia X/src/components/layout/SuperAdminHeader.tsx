import { useState } from 'react';
import { Search, Bell, LogOut, Moon, Sun, ShieldCheck } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import { Separator } from '@components/ui/separator';
import { useTheme } from '@context/ThemeProvider';
import { useAuth } from '@hooks/useAuth';
import { getInitials } from '@lib/utils';

export function SuperAdminHeader({ onSearch }: { onSearch?: (query: string) => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <header
      className="sticky top-0 z-40 flex h-[var(--topbar-height)] items-center justify-between border-b bg-background/95 backdrop-blur px-6 shadow-sm"
      role="banner"
    >
      {/* Left — Global Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Global Search (Admins, Institutes, Users)…"
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 h-9 text-xs sm:text-sm bg-muted/40 border-muted"
          />
        </div>
      </div>

      {/* Right — Actions & Profile */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="hidden sm:inline-flex gap-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 font-semibold px-2.5 py-1">
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          Super Admin Console
        </Badge>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          className="h-9 w-9"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        {/* System Notification Center */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="System notifications"
          className="relative h-9 w-9"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Profile badge */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 ring-2 ring-indigo-500/30">
            <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.full_name} />
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
              {user ? getInitials(user.full_name) : 'SA'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <p className="font-semibold text-foreground truncate max-w-[130px]">
              {user?.full_name ?? 'Haider Raza'}
            </p>
            <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">
              {user?.email ?? 'haiderwahla199@gmail.com'}
            </p>
          </div>
        </div>

        {/* Logout action */}
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
