import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { BudgetForm } from '../components/forms/BudgetForm';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatCard } from '../components/common/StatCard';
import { getBudgetPeriodRange } from '../utils/analytics';
import { getCategoryColor } from '../utils/formatters';
import { Budget } from '../types';
import {
  Layers,
  Plus,
  ShieldCheck,
  Flame,
  Edit2,
  Trash2,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Budgets: React.FC = () => {
  const { t } = useTranslation();
  const { budgets, expenses, deleteBudget } = useData();
  const { format } = useCurrency();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  // Each budget is measured over its own period (week / month / year) rather than always
  // over the current month, which is what the `period` column was for all along.
  const budgetStats = useMemo(
    () =>
      budgets.map((budget) => {
        const period = (budget.period || 'monthly') as 'weekly' | 'monthly' | 'yearly';
        const { start, end, daysLeft } = getBudgetPeriodRange(period);

        const spent = expenses
          .filter((e) => e.category === budget.category && e.date >= start && e.date <= end)
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const limit = Number(budget.limit_amount || 0);
        const percentUsed = limit > 0 ? (spent / limit) * 100 : 0;
        const safeDaily = Math.round((Math.max(0, limit - spent) / daysLeft) * 100) / 100;

        return { budget, period, spent, limit, percentUsed, safeDaily };
      }),
    [budgets, expenses]
  );

  const totalBudgetLimit = budgetStats.reduce((sum, s) => sum + s.limit, 0);
  const totalBudgetSpent = budgetStats.reduce((sum, s) => sum + s.spent, 0);
  const overallPercent = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {t('budgets.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t('budgets.subtitle')}
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          {t('budgets.add')}
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('budgets.totalLimit')}
          value={totalBudgetLimit}
          icon={<Layers className="w-4 h-4" />}
          highlightColor="#0071e3"
        />
        <StatCard
          title={t('budgets.spent')}
          value={totalBudgetSpent}
          icon={<Flame className="w-4 h-4" />}
          highlightColor={overallPercent >= 100 ? '#f43f5e' : '#f59e0b'}
        />
        <StatCard
          title={t('budgets.remaining')}
          value={Math.max(0, totalBudgetLimit - totalBudgetSpent)}
          icon={<ShieldCheck className="w-4 h-4" />}
          highlightColor="#10b981"
        />
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6" />}
          title={t('budgets.empty')}
          description={t('budgets.emptyDesc')}
          actionLabel={t('budgets.add')}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetStats.map(({ budget, period, spent, limit, percentUsed, safeDaily }) => {
            const isOverbudget = spent > limit;
            const categoryColor = getCategoryColor(budget.category);
            // A user-created category has no translation entry, so fall back to its own name
            // instead of rendering the lookup path.
            const categoryLabel = t(`expenses.categories.${budget.category}`, { defaultValue: budget.category });

            let statusVariant: 'success' | 'warning' | 'danger' = 'success';
            let statusText = t('budgets.status.safe');
            if (percentUsed >= 100) {
              statusVariant = 'danger';
              statusText = t('budgets.status.danger');
            } else if (percentUsed >= 75) {
              statusVariant = 'warning';
              statusText = t('budgets.status.warning');
            }

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  variant="glass"
                  padding="md"
                  className="group relative flex flex-col justify-between h-full hover:shadow-apple-md transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{
                          backgroundColor: `${categoryColor}15`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}30`,
                        }}
                      >
                        {categoryLabel.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                          {categoryLabel}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <Badge variant={statusVariant} size="sm">
                            {statusText}
                          </Badge>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
                            {t(`budgets.periodHint.${period}`)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingBudget(budget)}
                        title={t('common.edit')}
                        aria-label={t('common.edit')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingBudgetId(budget.id)}
                        title={t('common.delete')}
                        aria-label={t('common.delete')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress & Values */}
                  <div className="my-4 space-y-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 dark:text-zinc-400">
                        {format(spent)} / <strong className="text-slate-800 dark:text-zinc-200">{format(limit)}</strong>
                      </span>
                      <span
                        className={`font-bold ${
                          isOverbudget
                            ? 'text-rose-600 dark:text-rose-400'
                            : percentUsed >= 75
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {Math.round(percentUsed)}%
                      </span>
                    </div>

                    <Progress value={spent} max={limit} variant="dynamic" size="sm" />
                  </div>

                  {/* Daily Safe Spend Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{t('budgets.dailySafe')}:</span>
                    </span>
                    <span
                      className={`font-semibold ${
                        isOverbudget ? 'text-rose-500' : 'text-slate-900 dark:text-zinc-100'
                      }`}
                    >
                      {format(safeDaily)}
                    </span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('budgets.add')}
      >
        <BudgetForm
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={Boolean(editingBudget)}
        onClose={() => setEditingBudget(null)}
        title={t('budgets.edit')}
      >
        {editingBudget && (
          <BudgetForm
            initialData={editingBudget}
            onSuccess={() => setEditingBudget(null)}
            onCancel={() => setEditingBudget(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingBudgetId)}
        onClose={() => setDeletingBudgetId(null)}
        onConfirm={async () => {
          if (deletingBudgetId) {
            await deleteBudget(deletingBudgetId);
            setDeletingBudgetId(null);
          }
        }}
      />
    </div>
  );
};
