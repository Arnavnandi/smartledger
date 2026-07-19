import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Building2, ScrollText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: ShieldAlert },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Businesses', path: '/admin/businesses', icon: Building2 },
    { name: 'System Logs', path: '/admin/logs', icon: ScrollText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
          <span className="text-blue-500 mr-2">SmartLedger</span> Admin
        </div>
        
        <div className="p-4 mb-4 border-b border-slate-800">
          <div className="text-sm font-medium text-slate-300">Logged in as:</div>
          <div className="font-semibold truncate">{user?.firstName} {user?.lastName}</div>
          <div className="text-xs text-blue-400 mt-1 uppercase tracking-wider">
            {user?.authorities?.[0]?.authority?.replace('ROLE_', '') || 'ADMIN'}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/dashboard" className="w-full mb-2 block">
            <Button variant="outline" className="w-full text-slate-900 dark:text-slate-100">
              User App
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b flex items-center justify-between px-8">
          <h1 className="text-xl font-semibold">Super Admin Console</h1>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
