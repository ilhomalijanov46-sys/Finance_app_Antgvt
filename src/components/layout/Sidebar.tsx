import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Layers,
  Target,
  CalendarDays,
  BarChart3,
  User,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

export interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onNavigate }) => {
  const { t } = useTranslation();
  const { user, isDemoMode } = useAuth();

  const navItems = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/incomes', label: t('nav.incomes'), icon: TrendingUp },
    { to: '/expenses', label: t('nav.expenses'), icon: TrendingDown },
    { to: '/budgets', label: t('nav.budgets'), icon: Layers },
    { to: '/goals', label: t('nav.goals'), icon: Target },
    { to: '/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/statistics', label: t('nav.statistics'), icon: BarChart3 },
    { to: '/profile', label: t('nav.profile'), icon: User },
  ];

  return (
    <aside
      className={cn(
        'w-64 h-full flex flex-col justify-between p-4',
        'backdrop-blur-2xl bg-white/70 dark:bg-zinc-950/70',
        'border-r border-slate-200/80 dark:border-zinc-800/80',
        className
      )}
    >
      {/* Top Branding */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-apple-md shadow-blue-500/20 text-white font-bold">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>{t('app.title')}</span>
              {isDemoMode && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                  {t('auth.demoBadge')}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
              {t('app.trackerSubtitle')}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-600 text-white shadow-apple-sm font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50 dark:hover:bg-zinc-900/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Preview */}
      <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-800/60">
        <NavLink
          to="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-900/60 transition-colors"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name || 'User avatar'}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-zinc-300">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{user?.currency || 'USD'}</span>
            </p>
          </div>
        </NavLink>
      </div>
    </aside>
  );
};
