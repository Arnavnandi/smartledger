import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  PieChart,
  Settings,
  Plus,
  Sun,
  Moon,
  LogOut,
  Search,
  Sparkles,
  Laptop
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 transition-all">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        <Command className="w-full">
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <Command.Input
              autoFocus
              placeholder="Type a command or search (e.g. Dashboard, New Invoice)..."
              className="w-full h-12 text-xs bg-transparent text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400"
            />
            <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
            <Command.Empty className="py-6 text-center text-xs text-slate-500">
              No matching commands found.
            </Command.Empty>

            <Command.Group heading="Quick Navigation" className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-2 py-1">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                <span>Go to Dashboard</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/invoices'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Go to Invoices</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/clients'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Go to Clients</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/expenses'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Receipt className="w-4 h-4 text-indigo-500" />
                <span>Go to Expenses</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/reports'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <PieChart className="w-4 h-4 text-indigo-500" />
                <span>Go to Reports</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/activity'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Go to Activity Log</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/settings'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Settings className="w-4 h-4 text-indigo-500" />
                <span>Company Settings</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Create & Log" className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-2 py-1 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => navigate('/invoices/new'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Create New Invoice</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/expenses/new'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Log New Expense</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/clients/new'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add Client Account</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Appearance & Session" className="text-[10px] font-bold tracking-wider uppercase text-slate-400 px-2 py-1 mt-2">
              <Command.Item
                onSelect={() => runCommand(() => setTheme('light'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Switch to Light Theme</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => setTheme('dark'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Switch to Dark Theme</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => setTheme('system'))}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Laptop className="w-4 h-4 text-slate-400" />
                <span>Use System Theme</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(logout)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-indigo-500" /> SmartLedger Command Engine</span>
            <span>Press Esc to exit</span>
          </div>
        </Command>
      </div>
    </div>
  );
};
