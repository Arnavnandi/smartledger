import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 gap-1.5" aria-label="Breadcrumb">
      <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formattedName = value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-600" />
            {isLast ? (
              <span className="font-bold text-slate-800 dark:text-slate-200">{formattedName}</span>
            ) : (
              <Link to={to} className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                {formattedName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
