import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Receipt, 
  Settings, 
  Bell, 
  Check, 
  Plus, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Search,
  User as UserIcon,
  Building2,
  Command as CommandIcon,
  Activity
} from 'lucide-react';
import { notificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification.types';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import { Breadcrumbs } from '../components/shared/Breadcrumbs';
import { CommandPalette } from '../components/shared/CommandPalette';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [allNotifs, unread] = await Promise.all([
        notificationService.getAll(),
        notificationService.getUnreadCount()
      ]);
      setNotifications(allNotifs);
      setUnreadCount(unread.count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: PieChart },
    { name: 'Activity Log', path: '/activity', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const NotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition-all outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/40">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-glow-rose"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xl rounded-xl p-0">
        <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/90 backdrop-blur">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-600 dark:text-slate-300">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:bg-transparent">
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700/50" />
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            No notifications
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem
              key={notif.id}
              className={`flex flex-col items-start p-3.5 border-b border-slate-100 dark:border-slate-700/40 cursor-pointer transition-colors ${!notif.isRead ? 'bg-indigo-50/50 dark:bg-slate-700/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/20'}`}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
            >
              <div className="flex w-full justify-between items-center mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  notif.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                  notif.type === 'WARNING' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                  notif.type === 'ERROR' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {notif.type}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{notif.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const UserAvatarDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/40 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all">
          {userInitials}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xl rounded-xl p-1">
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{company?.name || 'SmartLedger User'}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Company Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60">
          <UserIcon className="w-3.5 h-3.5 text-indigo-500" /> My Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
        <DropdownMenuItem onClick={logout} className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'SL';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Sidebar Desktop */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0 backdrop-blur-xl transition-all duration-300 relative z-20`}>
        {/* Collapse Toggle Floating Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-7 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all z-30"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Header */}
        <div className={`p-4 border-b border-slate-200 dark:border-slate-800 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-glow-indigo text-slate-950 font-black shrink-0">
            <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-600 dark:from-white dark:via-slate-200 dark:to-indigo-300 bg-clip-text text-transparent truncate">
                SmartLedger
              </h2>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase truncate">
                {company?.name || 'Pro Financials'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={sidebarCollapsed ? item.name : undefined}
                className={`relative group flex items-center ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-2.5'} rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 dark:from-indigo-600/30 dark:to-violet-600/20 text-indigo-600 dark:text-white border border-indigo-500/30 shadow-glow-indigo font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-glow-indigo"></span>
                )}
                <item.icon className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-3'} transition-colors shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-300'}`} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/60">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center p-1' : 'justify-between p-2'} rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                {userInitials}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.username}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Account Active</p>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Top Header */}
        <header className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl flex justify-between items-center shrink-0 transition-colors duration-300 gap-4">
          {/* Mobile Menu Button & Brand */}
          <div className="flex items-center gap-3 md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-700 dark:text-slate-300"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h2 className="text-base font-bold bg-gradient-to-r from-slate-900 to-indigo-600 dark:from-white dark:to-indigo-300 bg-clip-text text-transparent">
              SmartLedger
            </h2>
          </div>

          {/* Breadcrumbs Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Breadcrumbs />
          </div>

          {/* Header Right Actions & Cmd+K Trigger */}
          <div className="flex items-center space-x-3 ml-auto">
            {/* Quick Command Palette Button */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 h-9 px-3 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search or command...</span>
              <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                <CommandIcon className="w-2.5 h-2.5" /> K
              </span>
            </button>

            <div className="hidden lg:flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mr-2 animate-pulse"></span>
              Currency: <strong className="text-slate-800 dark:text-slate-200 ml-1">{company?.currency || 'INR'}</strong>
            </div>

            <Link to="/invoices/new">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs h-9 px-3.5 rounded-xl shadow-glow-indigo flex items-center gap-1.5 transition-all transform active:scale-95">
                <Plus className="w-3.5 h-3.5" /> New Invoice
              </Button>
            </Link>

            <ThemeToggle />
            <NotificationBell />
            <UserAvatarDropdown />
          </div>
        </header>

        {/* Mobile Slide-out Nav */}
        {sidebarOpen && (
          <nav className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-1 shrink-0 z-50">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium ${
                  location.pathname === item.path ? 'bg-indigo-50 dark:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </Link>
            ))}
            <Button variant="destructive" size="sm" className="w-full justify-center mt-3" onClick={logout}>
              Log out
            </Button>
          </nav>
        )}

        {/* View Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
