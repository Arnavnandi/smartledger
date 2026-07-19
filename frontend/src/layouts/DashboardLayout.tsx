import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Users, Receipt, Settings, Bell, Check } from 'lucide-react';
import { notificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every minute
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
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const NotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground outline-none">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center p-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-1 text-xs">
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map(notif => (
            <DropdownMenuItem
              key={notif.id}
              className={`flex flex-col items-start p-3 ${!notif.isRead ? 'bg-muted/50' : ''}`}
              onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
            >
              <div className="flex w-full justify-between items-center mb-1">
                <span className={`text-xs font-semibold ${notif.type === 'SUCCESS' ? 'text-green-600' : notif.type === 'WARNING' ? 'text-yellow-600' : notif.type === 'ERROR' ? 'text-red-600' : 'text-blue-600'}`}>
                  {notif.type}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{notif.message}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-muted/40 flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-background border-r hidden md:flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary">SmartLedger</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="mb-2 px-2 text-sm text-muted-foreground truncate">
            {user?.username}
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={logout}>
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden p-4 border-b bg-background flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-primary">SmartLedger</h2>
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
              Menu
            </Button>
          </div>
        </header>
        
        {/* Desktop Top Header (for Bell) */}
        <header className="hidden md:flex p-4 border-b bg-background justify-end items-center shrink-0">
           <NotificationBell />
        </header>

        {/* Mobile Sidebar (simplistic implementation) */}
        {sidebarOpen && (
          <nav className="md:hidden bg-background border-b p-4 space-y-2 shrink-0">
             {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`block px-4 py-2 rounded-md ${
                  location.pathname === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Button variant="outline" className="w-full justify-start mt-4" onClick={logout}>
              Log out
            </Button>
          </nav>
        )}

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
