import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'inline' | 'card';
}

export function ThemeToggle({ variant = 'card' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'inline') {
    return (
      <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
          {isDark ? <Moon className="h-5 w-5 text-indigo-600" /> : <Sun className="h-5 w-5 text-amber-500" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Appearance</p>
          <p className="text-xs text-gray-500">Currently using {isDark ? 'Dark' : 'Light'} mode</p>
        </div>
      </div>
      <Button onClick={toggleTheme} variant="outline" size="sm" className="rounded-xl">
        Switch to {isDark ? 'Light' : 'Dark'}
      </Button>
    </div>
  );
}
