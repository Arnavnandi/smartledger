import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
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
  PieChart
} from 'lucide-react';
import { notificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification.types';
import { ThemeToggle } from '../components/shared/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const NotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all outline-none">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-glow-rose"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-slate-800 border-slate-700 text-slate-100 shadow-2xl rounded-xl p-0">
        <div className="flex justify-between items-center p-3 border-b border-slate-700/80 bg-slate-800/90 backdrop-blur">
          <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-300">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-transparent">
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-700/50" />
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No notifications
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem
              key={notif.id}
              className={`flex flex-col items-start p-3.5 border-b border-slate-700/40 cursor-pointer transition-colors ${!notif.isRead ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'}`}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
            >
              <div className="flex w-full justify-between items-center mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  notif.type === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                  notif.type === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                  notif.type === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {notif.type}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{notif.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'SL';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800 hidden md:flex flex-col shrink-0 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center shadow-glow-indigo text-slate-950 font-black">
            <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              SmartLedger
            </h2>
            <p className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
              {company?.name || 'Pro Financials'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative group flex items-center px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/30 to-violet-600/20 text-white border border-indigo-500/30 shadow-glow-indigo font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full shadow-glow-indigo"></span>
                )}
                <item.icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                {userInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.username}</p>
                <p className="text-[10px] text-slate-400 truncate">Account Active</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
        {/* Top Header */}
        <header className="h-16 px-6 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex justify-between items-center shrink-0">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-300"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h2 className="text-base font-bold bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
              SmartLedger
            </h2>
          </div>

          <div className="hidden md:flex items-center text-xs font-medium text-slate-400 bg-slate-800/40 border border-slate-700/40 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            Base Currency: <strong className="text-slate-200 ml-1">{company?.currency || 'INR'}</strong>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-3 ml-auto">
            <Link to="/invoices/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 px-3.5 rounded-xl shadow-glow-indigo flex items-center gap-1.5 transition-all">
                <Plus className="w-3.5 h-3.5" /> New Invoice
              </Button>
            </Link>

            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Mobile Slide-out Nav */}
        {sidebarOpen && (
          <nav className="md:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1 shrink-0 z-50">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium ${
                  location.pathname === item.path ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'
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
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

