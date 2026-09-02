import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/common/StatCard';
import { PeriodSelector, PeriodType, DateRange } from '../components/ui/PeriodSelector';
import { getExpensesByCategory, getMonthlyTrends } from '../utils/analytics';
import { getCategoryColor, formatAxisValue, toDateKey } from '../utils/formatters';
import { LocaleCode } from '../types';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export const Statistics: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { incomes, expenses } = useData();
  const { format, currency } = useCurrency();

  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  // Filter transactions based on selected period
  const filteredData = useMemo(() => {
    const today = toDateKey();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toDateKey(yesterdayDate);

    const sevenDaysAgoDate = new Date();
    sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
    const sevenDaysAgo = toDateKey(sevenDaysAgoDate);

    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgo = toDateKey(thirtyDaysAgoDate);

    const ninetyDaysAgoDate = new Date();
    ninetyDaysAgoDate.setDate(ninetyDaysAgoDate.getDate() - 90);
    const ninetyDaysAgo = toDateKey(ninetyDaysAgoDate);

    const currentMonthStr = today.substring(0, 7);

    let incs = incomes;
    let exps = expenses;

    if (period === 'today') {
      incs = incomes.filter((i) => i.date === today);
      exps = expenses.filter((e) => e.date === today);
    } else if (period === 'yesterday') {
      incs = incomes.filter((i) => i.date === yesterday);
      exps = expenses.filter((e) => e.date === yesterday);
    } else if (period === '7days') {
      incs = incomes.filter((i) => i.date >= sevenDaysAgo && i.date <= today);
      exps = expenses.filter((e) => e.date >= sevenDaysAgo && e.date <= today);
    } else if (period === '30days') {
      incs = incomes.filter((i) => i.date >= thirtyDaysAgo && i.date <= today);
      exps = expenses.filter((e) => e.date >= thirtyDaysAgo && e.date <= today);
    } else if (period === '90days') {
      incs = incomes.filter((i) => i.date >= ninetyDaysAgo && i.date <= today);
      exps = expenses.filter((e) => e.date >= ninetyDaysAgo && e.date <= today);
    } else if (period === 'this_month') {
      incs = incomes.filter((i) => i.date.startsWith(currentMonthStr));
      exps = expenses.filter((e) => e.date.startsWith(currentMonthStr));
    } else if (period === 'custom' && customRange?.startDate && customRange?.endDate) {
      incs = incs.filter((i) => i.date >= customRange.startDate && i.date <= customRange.endDate);
      exps = exps.filter((e) => e.date >= customRange.startDate && e.date <= customRange.endDate);
    }

    const totalIncome = incs.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExpense = exps.reduce((s, e) => s + Number(e.amount || 0), 0);
    const savings = Math.max(0, totalIncome - totalExpense);
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const categoryBreakdown = getExpensesByCategory(exps);

    return {
      incomes: incs,
      expenses: exps,
      totalIncome,
      totalExpense,
      savings,
      savingsRate,
      categoryBreakdown,
    };
  }, [incomes, expenses, period, customRange]);

  const monthlyTrends = getMonthlyTrends(incomes, expenses, 6, i18n.language as LocaleCode);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with PeriodSelector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            {t('statistics.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t('statistics.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PeriodSelector
            value={period}
            customRange={customRange}
            onChange={(p, range) => {
              setPeriod(p);
              if (range) setCustomRange(range);
            }}
            showAllOption={true}
          />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('incomes.total')}
          value={filteredData.totalIncome}
          icon={<TrendingUp className="w-4 h-4" />}
          highlightColor="#10b981"
        />
        <StatCard
          title={t('expenses.total')}
          value={filteredData.totalExpense}
          icon={<TrendingDown className="w-4 h-4" />}
          highlightColor="#f43f5e"
        />
        <StatCard
          title={t('dashboard.savingsRate')}
          value={filteredData.savingsRate}
          isCurrency={false}
          suffix="%"
          icon={<Sparkles className="w-4 h-4" />}
          highlightColor="#0071e3"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Inflow vs Outflow Bar Chart */}
        <Card variant="glass" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span>{t('statistics.incomeVsExpense')}</span>
            </h3>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatAxisValue(val, currency)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.08)', rx: 8 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 p-3 shadow-2xl border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1.5 min-w-[150px]">
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{label}</p>
                          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>{t('incomes.title')}:</span>
                            <span>{format(Number(payload[0]?.value || 0))}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-blue-600 dark:text-blue-400 font-semibold">
                            <span>{t('expenses.title')}:</span>
                            <span>{format(Number(payload[1]?.value || 0))}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" fill="#0071e3" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expenses by Category Modern Donut Chart */}
        <Card variant="glass" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-500" />
              <span>{t('statistics.categoryBreakdown')}</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Всего: {format(filteredData.totalExpense)}
            </span>
          </div>

          <div className="h-72 w-full pt-2 relative">
            {filteredData.categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t('expenses.empty')}
              </div>
            ) : (
              <div className="h-full w-full relative">
                {/* Center Summary Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Расходы
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5">
                    {format(filteredData.totalExpense)}
                  </span>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredData.categoryBreakdown}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      cornerRadius={6}
                    >
                      {filteredData.categoryBreakdown.map((entry) => (
                        <Cell
                          key={`cell-${entry.category}`}
                          fill={getCategoryColor(entry.category)}
                          className="hover:opacity-80 transition-opacity outline-none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const catName = t(`expenses.categories.${data.category}`, { defaultValue: data.category });
                          return (
                            <div className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 p-3 shadow-2xl border border-slate-200/80 dark:border-zinc-800 text-xs space-y-1">
                              <p className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: getCategoryColor(data.category) }}
                                />
                                {catName}
                              </p>
                              <p className="text-slate-600 dark:text-zinc-300 font-semibold pl-4">
                                {format(data.total)} ({Math.round(data.percentage)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top Categories Ranking Table */}
      <Card variant="glass" padding="md">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3">
          {t('statistics.topExpenses')}
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
          {filteredData.categoryBreakdown.slice(0, 6).map((item, index) => (
            <div key={item.category} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-center text-xs font-bold text-slate-400">
                  #{index + 1}
                </span>
                <div
                  className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-sm"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                  {t(`expenses.categories.${item.category}`, { defaultValue: item.category })}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0">
                <span className="text-slate-500 dark:text-zinc-400">
                  {item.count} {t('statistics.operationsCount')} ({Math.round(item.percentage)}%)
                </span>
                <span className="font-bold text-slate-900 dark:text-zinc-100">
                  {format(item.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
