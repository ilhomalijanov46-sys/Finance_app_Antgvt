import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { GoalForm } from '../components/forms/GoalForm';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { StatCard } from '../components/common/StatCard';
import { Goal } from '../types';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  Sparkles,
  Calendar,
  Edit2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Goals: React.FC = () => {
  const { t } = useTranslation();
  const { goals, depositToGoal, deleteGoal } = useData();
  const { format } = useCurrency();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [depositingGoal, setDepositingGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount || 0), 0);
  const completedGoalsCount = goals.filter((g) => g.current_amount >= g.target_amount).length;

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositingGoal || !depositAmount || Number(depositAmount) <= 0) return;

    const amount = Number(depositAmount);
    const updated = await depositToGoal(depositingGoal.id, amount);

    // If goal reached 100%, trigger confetti celebration!
    if (updated.current_amount >= updated.target_amount) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0071e3', '#10b981', '#f59e0b', '#ec4899'],
      });
    }

    setDepositingGoal(null);
    setDepositAmount('');
  };

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {t('goals.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t('goals.subtitle')}
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          {t('goals.add')}
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('goals.currentAmount')}
          value={totalSaved}
          icon={<Sparkles className="w-4 h-4" />}
          highlightColor="#10b981"
        />
        <StatCard
          title={t('goals.targetAmount')}
          value={totalTarget}
          icon={<Target className="w-4 h-4" />}
          highlightColor="#0071e3"
        />
        <StatCard
          title={t('goals.completed')}
          value={completedGoalsCount}
          isCurrency={false}
          suffix={` / ${goals.length}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          highlightColor="#8b5cf6"
        />
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-6 h-6" />}
          title={t('goals.empty')}
          description={t('goals.emptyDesc')}
          actionLabel={t('goals.add')}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const isCompleted = goal.current_amount >= goal.target_amount;
            const daysLeft = getDaysLeft(goal.deadline);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  variant="glass"
                  padding="md"
                  className="relative flex flex-col justify-between h-full hover:shadow-apple-md transition-all border border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl"
                >
                  {/* Top Bar: Icon, Title, Deadline & Visible Action Buttons */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-apple-sm mt-0.5"
                        style={{ backgroundColor: goal.color || '#0071e3' }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Target className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 leading-snug break-words">
                          {goal.title}
                        </h3>
                        {goal.deadline && (
                          <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200/40 dark:border-zinc-700/40">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {daysLeft && daysLeft > 0
                                ? t('goals.daysLeft', { count: daysLeft })
                                : goal.deadline}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions (Always accessible) */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={() => setEditingGoal(goal)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                        title={t('common.edit') || 'Редактировать'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGoalId(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title={t('common.delete') || 'Удалить'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Values Breakdown */}
                  <div className="my-4 space-y-2.5 pt-3 border-t border-slate-100/80 dark:border-zinc-800/80">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Накоплено</span>
                        <p className={`text-base sm:text-lg font-bold tracking-tight ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-zinc-100'}`}>
                          {format(goal.current_amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">Целевая сумма</span>
                        <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                          {format(goal.target_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <Progress
                        value={goal.current_amount}
                        max={goal.target_amount}
                        customColor={goal.color}
                        size="md"
                      />

                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-zinc-300">{percent}%</span>
                        {isCompleted ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                            🎉 {t('goals.completed') || 'Цель достигнута!'}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 font-normal">
                            Осталось: {format(Math.max(0, goal.target_amount - goal.current_amount))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Deposit Action Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60">
                    <Button
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'primary'}
                      className="w-full text-xs font-medium h-9"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setDepositingGoal(goal)}
                    >
                      {isCompleted ? 'Пополнить еще' : t('goals.deposit')}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      <Dialog
        isOpen={Boolean(depositingGoal)}
        onClose={() => setDepositingGoal(null)}
        title={`${t('goals.deposit')}: ${depositingGoal?.title}`}
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <Input
            label={t('goals.depositAmount')}
            type="number"
            step="any"
            placeholder="0.00"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setDepositingGoal(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('goals.deposit')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Add Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('goals.add')}
      >
        <GoalForm
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        isOpen={Boolean(editingGoal)}
        onClose={() => setEditingGoal(null)}
        title={t('goals.edit')}
      >
        {editingGoal && (
          <GoalForm
            initialData={editingGoal}
            onSuccess={() => setEditingGoal(null)}
            onCancel={() => setEditingGoal(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingGoalId)}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={async () => {
          if (deletingGoalId) {
            await deleteGoal(deletingGoalId);
            setDeletingGoalId(null);
          }
        }}
      />
    </div>
  );
};
