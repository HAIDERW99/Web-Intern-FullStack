import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@context/ThemeProvider';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';
import { cn } from '@lib/utils';

const themeOptions = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how AcademiaX looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3" role="radiogroup" aria-label="Theme selection">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant="outline"
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex-1 flex-col h-auto py-4 gap-2',
                  theme === value && 'border-primary bg-primary/5 text-primary',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* More setting sections go here in Phase 3 */}
    </div>
  );
}
