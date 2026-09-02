import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';
import { useCurrency } from '../../hooks/useCurrency';
import { formatDateTime, getCategoryColor } from '../../utils/formatters';
import { useTranslation } from 'react-i18next';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  CreditCard,
  Banknote,
  Building2,
} from 'lucide-react';
import { LocaleCode, PaymentMethod } from '../../types';

export interface EntityCardProps {
  variant: 'income' | 'expense' | 'budget' | 'goal' | 'stat';
  title: string;
  amount: number;
  subtitle?: string;
  category?: string;
  date?: string;
  time?: string;
  paymentMethod?: PaymentMethod;
  progress?: { current: number; max: number };
  trend?: { percentage: number; isPositive: boolean };
  onEdit?: () => void;
  onDelete?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
  badgeText?: string;
  className?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  variant,
  title,
  amount,
  subtitle,
  category,
  date,
  time,
  paymentMethod,
  progress,
  trend,
  onEdit,
  onDelete,
  onAction,
  actionLabel,
  icon,
  badgeText,
  className = '',
}) => {
  const { format } = useCurrency();
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as LocaleCode) || 'ru';

  const categoryColor = category ? getCategoryColor(category) : '#0071e3';

  // Method Icon & Label
  const getMethodBadge = (method?: PaymentMethod) => {
    if (!method) return null;
    switch (method) {
      case 'card':
        return { label: t('expenses.methods.card'), icon: <CreditCard className="w-3 h-3" /> };
      case 'cash':
        return { label: t('expenses.methods.cash'), icon: <Banknote className="w-3 h-3" /> };
      case 'transfer':
        return { label: t('expenses.methods.transfer'), icon: <Building2 className="w-3 h-3" /> };
      default:
        return null;
    }
  };

  const methodBadge = getMethodBadge(paymentMethod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        variant="interactive"
        padding="md"
        className={`relative flex flex-col justify-between transition-all duration-200 hover:shadow-apple-md border border-slate-200/70 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl ${className}`}
      >
        {/* Top Row: Icon + Category/Title + Action Buttons */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Category Icon */}
            {variant === 'income' && (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-apple-sm mt-0.5">
                {icon || <ArrowDownLeft className="w-4 h-4" />}
              </div>
            )}
            {variant === 'expense' && (
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-apple-sm mt-0.5">
                {icon || <ArrowUpRight className="w-4 h-4" />}
              </div>
            )}
            {variant === 'goal' && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold shadow-apple-sm mt-0.5"
                style={{ backgroundColor: categoryColor }}
              >
                {icon || <Target className="w-4 h-4" />}
              </div>
            )}
            {variant === 'budget' && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  color: categoryColor,
                  borderColor: `${categoryColor}30`,
                  borderWidth: 1,
                }}
              >
                {icon || <Sparkles className="w-4 h-4" />}
              </div>
            )}

            {/* Title & Contextual Info */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                {title === 'transfer'
                  ? variant === 'income'
                    ? t('incomes.categories.transfer')
                    : t('expenses.categories.transfer')
                  : title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 break-words line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons (Always neatly accessible) */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {badgeText && (
              <Badge variant="custom" customColor={categoryColor} size="sm">
                {badgeText}
              </Badge>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title={t('common.edit')}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title={t('common.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Middle / Bottom: Amount, Method Badge, Date & Time */}
        <div className="mt-4 pt-2 border-t border-slate-100/60 dark:border-zinc-800/60 flex flex-wrap sm:flex-nowrap items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span
              className={`font-bold tracking-tight break-words ${
                String(amount).length > 10 ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
              } ${
                variant === 'income'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : variant === 'expense'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-zinc-100'
              }`}
            >
              {variant === 'income'
                ? `+${format(amount)}`
                : variant === 'expense'
                ? `−${format(amount)}`
                : format(amount)}
            </span>
          </div>

          {/* Right Column: Payment Method Tag & Timestamp */}
          <div className="flex flex-col items-end gap-1 text-right shrink-0">
            {methodBadge && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/50 dark:border-zinc-700/50 whitespace-nowrap shrink-0">
                {methodBadge.icon}
                <span className="whitespace-nowrap">{methodBadge.label}</span>
              </span>
            )}

            {date && (
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap">
                {formatDateTime(date, time, locale)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar (for budgets & goals) */}
        {progress && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
              <span>
                {format(progress.current)} / {format(progress.max)}
              </span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">
                {Math.round((progress.current / progress.max) * 100)}%
              </span>
            </div>
            <Progress
              value={progress.current}
              max={progress.max}
              variant={variant === 'budget' ? 'dynamic' : 'default'}
              customColor={variant === 'goal' ? categoryColor : undefined}
              size="sm"
            />
          </div>
        )}

        {/* Trend (for stat cards) */}
        {trend && (
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
            {trend.isPositive ? (
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />+{trend.percentage}%
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-3.5 h-3.5 mr-1" />-{trend.percentage}%
              </span>
            )}
            <span className="text-slate-400 dark:text-zinc-500">{t('common.vsLastPeriod')}</span>
          </div>
        )}

        {/* Footer Action button */}
        {onAction && actionLabel && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60">
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
