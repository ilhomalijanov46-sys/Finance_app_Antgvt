import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { IncomeForm } from '../components/forms/IncomeForm';
import { ExpenseForm } from '../components/forms/ExpenseForm';
import { GoalForm } from '../components/forms/GoalForm';
import { getMonthlyTrends, getExpensesByCategory, calculateSummary } from '../utils/analytics';
import { formatDateTime, formatAxisValue, toDateKey } from '../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Income, Expense, LocaleCode } from '../types';

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { incomes, expenses, goals, summary } = useData();
  const { format, currency } = useCurrency();

  const [activeModal, setActiveModal] = useState<'income' | 'expense' | 'goal' | null>(null);

  // The KPI cards and the verdict are all phrased in monthly terms ("Доходы за месяц",
  // "Расходы превышают 85% ежемесячного дохода"), so they need a summary scoped to the
  // current month. `summary` from the context stays all-time — that is what the balance
  // headline above them means.
  const monthSummary = useMemo(() => {
    const currentMonth = toDateKey().slice(0, 7);
    return calculateSummary(
      incomes.filter((i) => i.date.startsWith(currentMonth)),
      expenses.filter((e) => e.date.startsWith(currentMonth))
    );
  }, [incomes, expenses]);

  // Financial Verdict determination
  const getVerdict = () => {
    if (monthSummary.totalIncome === 0 && monthSummary.totalExpense === 0) {
      return {
        badge: t('dashboard.verdict.balanced'),
        sub: t('dashboard.verdictSub.balanced'),
        color: '#0071e3',
      };
    }
    if (monthSummary.savingsRate >= 30) {
      return {
        badge: t('dashboard.verdict.great'),
        sub: t('dashboard.verdictSub.great'),
        color: '#10b981',
      };
    }
    if (monthSummary.savingsRate >= 15) {
      return {
        badge: t('dashboard.verdict.balanced'),
        sub: t('dashboard.verdictSub.balanced'),
        color: '#3b82f6',
      };
    }
    return {
      badge: t('dashboard.verdict.warning'),
      sub: t('dashboard.verdictSub.warning'),
      color: '#f59e0b',
    };
  };

  const verdict = getVerdict();
  const monthlyTrends = getMonthlyTrends(incomes, expenses, 6, i18n.language as LocaleCode);
  const categoryExpenses = getExpensesByCategory(expenses);
  const topExpenseCategory = categoryExpenses[0];

  // Combine and sort recent transactions
  type Transaction =
    | { type: 'income'; data: Income }
    | { type: 'expense'; data: Expense };

  const recentTransactions: Transaction[] = [
    ...incomes.map((i) => ({ type: 'income' as const, data: i })),
    ...expenses.map((e) => ({ type: 'expense' as const, data: e })),
  ]
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Hero Net Balance Section */}
      <Card
        variant="glass"
        padding="lg"
        className="relative overflow-hidden bg-gradient-to-br from-white/90 via-white/70 to-slate-50/50 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-950/50 border-slate-200/80 dark:border-zinc-800/80 shadow-apple-md"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                {t('dashboard.netBalance')}
              </span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${verdict.color}15`,
                  color: verdict.color,
                  border: `1px solid ${verdict.color}30`,
                }}
              >
                {verdict.badge}
              </span>
            </div>

            <div className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
              {format(summary.netBalance)}
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md">
              {verdict.sub}
            </p>
          </div>

          {/* Quick Action Button Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              leftIcon={<ArrowDownLeft className="w-4 h-4 text-emerald-300" />}
              onClick={() => setActiveModal('income')}
            >
              {t('dashboard.addIncome')}
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ArrowUpRight className="w-4 h-4 text-rose-500" />}
              onClick={() => setActiveModal('expense')}
            >
              {t('dashboard.addExpense')}
            </Button>
            <Button
              variant="glass"
              size="md"
              leftIcon={<Target className="w-4 h-4 text-blue-500" />}
              onClick={() => setActiveModal('goal')}
            >
              {t('dashboard.transferToGoal')}
            </Button>
          </div>
        </div>

        {/* Ambient background blur circle */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      </Card>

      {/* 2. KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.monthlyIncome')}
          value={monthSummary.totalIncome}
          icon={<TrendingUp className="w-4 h-4" />}
          highlightColor="#10b981"
          trend={{ value: 8.4, isPositive: true }}
        />
        <StatCard
          title={t('dashboard.monthlyExpense')}
          value={monthSummary.totalExpense}
          icon={<TrendingDown className="w-4 h-4" />}
          highlightColor="#f43f5e"
          trend={{ value: 3.2, isPositive: false }}
        />
        <StatCard
          title={t('dashboard.savingsRate')}
          value={monthSummary.savingsRate}
          isCurrency={false}
          suffix="%"
          icon={<Percent className="w-4 h-4" />}
          highlightColor="#3b82f6"
          subtitle={`${format(Math.max(0, summary.netBalance))} ${t('goals.currentAmount')}`}
        />
        <StatCard
          title={t('dashboard.activeGoals')}
          value={summary.activeGoalsCount}
          isCurrency={false}
          icon={<Target className="w-4 h-4" />}
          highlightColor="#8b5cf6"
          subtitle={`${goals.length} ${t('goals.title')}`}
        />
      </div>

      {/* 3. Data Storytelling Insight Callout */}
      {topExpenseCategory && (
        <Card
          variant="glass"
          padding="md"
          className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent flex items-center gap-3.5"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>{t('dashboard.dataStory')}</span>
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            </h4>
            <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
              {t('dashboard.storyIncrease', {
                category: t(`expenses.categories.${topExpenseCategory.category}`),
                percent: Math.round(topExpenseCategory.percentage),
              })}
            </p>
          </div>
        </Card>
      )}

      {/* 4. Cash Flow Chart & Recent Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Cash Flow Area Chart */}
        <Card variant="glass" padding="lg" className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {t('dashboard.cashFlow')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {t('dashboard.cashFlowDesc')}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {t('incomes.title')}
              </span>
              <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                {t('expenses.title')}
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0071e3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0071e3" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatAxisValue(val, currency)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 p-3 shadow-apple-lg border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{label}</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {t('incomes.title')}: {format(Number(payload[0]?.value || 0))}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400 font-semibold">
                            {t('expenses.title')}: {format(Number(payload[1]?.value || 0))}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#0071e3"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right 1 Col: Recent Transactions Feed */}
        <Card variant="glass" padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800/60">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {t('dashboard.recentTransactions')}
            </h3>
            <Link
              to="/expenses"
              className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium flex items-center gap-0.5"
            >
              <span>{t('dashboard.viewAll')}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/40 my-2">
            {recentTransactions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                {t('dashboard.noTransactions')}
              </p>
            ) : (
              recentTransactions.map((tx) => {
                const isInc = tx.type === 'income';
                const item = tx.data;
                return (
                  <div
                    key={`${tx.type}-${item.id}`}
                    className="py-2.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                          isInc
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isInc ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                          {isInc
                            ? t(`incomes.categories.${item.category}`, { defaultValue: (item as Income).source || item.category })
                            : t(`expenses.categories.${item.category}`, { defaultValue: item.category })}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                          {formatDateTime(item.date, item.time, (i18n.language as any) || 'ru')} {item.note ? `• ${item.note}` : ''}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold shrink-0 ${
                        isInc
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-zinc-100'
                      }`}
                    >
                      {isInc ? `+${format(item.amount)}` : `-${format(item.amount)}`}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => setActiveModal('expense')}
            >
              + {t('expenses.add')}
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Modals */}
      <Dialog
        isOpen={activeModal === 'income'}
        onClose={() => setActiveModal(null)}
        title={t('incomes.add')}
      >
        <IncomeForm onSuccess={() => setActiveModal(null)} onCancel={() => setActiveModal(null)} />
      </Dialog>

      <Dialog
        isOpen={activeModal === 'expense'}
        onClose={() => setActiveModal(null)}
        title={t('expenses.add')}
      >
        <ExpenseForm onSuccess={() => setActiveModal(null)} onCancel={() => setActiveModal(null)} />
      </Dialog>

      <Dialog
        isOpen={activeModal === 'goal'}
        onClose={() => setActiveModal(null)}
        title={t('goals.add')}
      >
        <GoalForm onSuccess={() => setActiveModal(null)} onCancel={() => setActiveModal(null)} />
      </Dialog>
    </div>
  );
};
