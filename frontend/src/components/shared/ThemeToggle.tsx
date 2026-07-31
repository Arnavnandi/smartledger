import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        title={`Current theme: ${theme} (${resolvedTheme})`}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xl rounded-xl p-1 z-50"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            theme === 'light'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            theme === 'dark'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-3.5 w-3.5 text-indigo-400" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
            theme === 'system'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
