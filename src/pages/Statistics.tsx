import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { useIsMobile } from '../hooks/useMediaQuery';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/common/StatCard';
import { PeriodSelector, PeriodType, DateRange } from '../components/ui/PeriodSelector';
import { getExpensesByCategory, getMonthlyTrendsForRange, getPeriodRange, filterByPeriod } from '../utils/analytics';
import { getCategoryColor, formatAxisValue } from '../utils/formatters';
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
  // Chart sizing that Tailwind cannot express: recharts takes these as numbers.
  const isMobile = useIsMobile();

  const [period, setPeriod] = useState<PeriodType>('this_month');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  // Filter transactions based on selected period
  const periodRange = useMemo(() => getPeriodRange(period, customRange), [period, customRange]);

  const filteredData = useMemo(() => {
    const range = periodRange;
    const incs = filterByPeriod(incomes, range);
    const exps = filterByPeriod(expenses, range);

    const totalIncome = incs.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExpense = exps.reduce((s, e) => s + Number(e.amount || 0), 0);
    // Not clamped to 0: overspending must show as negative, not disappear as zero.
    const savings = totalIncome - totalExpense;
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
  }, [incomes, expenses, periodRange]);

  // Follows the same period filter as the KPI cards and the pie chart above, instead of
  // always showing a fixed trailing 6 months regardless of what's selected.
  const monthlyTrends = useMemo(
    () => getMonthlyTrendsForRange(incomes, expenses, periodRange, i18n.language as LocaleCode),
    [incomes, expenses, periodRange, i18n.language]
  );

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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
          // Third of three in a two-column grid: without this it sits alone in half a
          // row with an empty square beside it.
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Inflow vs Outflow Bar Chart */}
        <Card variant="glass" padding="lg">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>{t('statistics.incomeVsExpense')}</span>
              </h3>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-medium shrink-0">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                {t('statistics.legendIncome')}
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {t('statistics.legendExpense')}
              </span>
            </div>
          </div>

          <div className="h-60 sm:h-72 w-full pt-2 sm:pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrends}
                margin={{ top: 10, right: isMobile ? 4 : 10, left: 0, bottom: 0 }}
                barCategoryGap={isMobile ? '20%' : '10%'}
              >
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={isMobile ? 10 : 11}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  // A phone cannot fit every month name across the axis; thinning the
                  // labels beats printing them on top of each other.
                  interval="preserveStartEnd"
                  minTickGap={isMobile ? 12 : 4}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={isMobile ? 10 : 11}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 38 : 56}
                  tickCount={isMobile ? 4 : 5}
                  tickFormatter={(val) => formatAxisValue(val, currency)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.08)', rx: 8 }}
                  offset={isMobile ? 12 : 10}
                  position={isMobile ? { y: 8 } : undefined}
                  wrapperStyle={{ outline: 'none', zIndex: 10 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-2xl border border-slate-200/80 dark:border-zinc-800 text-[11px] sm:text-xs space-y-1.5 min-w-[140px] max-w-[190px]">
                          <p className="font-bold text-slate-900 dark:text-zinc-100">{label}</p>
                          <div className="flex items-baseline justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span className="shrink-0">{t('incomes.title')}:</span>
                            <span className="text-right">{format(Number(payload[0]?.value || 0))}</span>
                          </div>
                          <div className="flex items-baseline justify-between gap-3 text-rose-600 dark:text-rose-400 font-semibold">
                            <span className="shrink-0">{t('expenses.title')}:</span>
                            <span className="text-right">{format(Number(payload[1]?.value || 0))}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expenses by Category Modern Donut Chart */}
        <Card variant="glass" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2 min-w-0">
              <PieIcon className="w-4 h-4 text-purple-500 shrink-0" />
              <span className="truncate">{t('statistics.categoryBreakdown')}</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 whitespace-nowrap">
              {t('common.total', { value: format(filteredData.totalExpense) })}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2 relative">
            {filteredData.categoryBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t('expenses.empty')}
              </div>
            ) : (
              <div className="h-full w-full relative">
                {/* Centre summary, capped to the ring's hole: a seven-figure UZS total
                    used to run out over the segments on both sides. */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2 px-4">
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    {t('statistics.expensesLabel')}
                  </span>
                  <span className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 max-w-[9rem] text-center leading-tight break-words">
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
                      // Percentages, not fixed pixels: on a narrow phone the old 95px
                      // ring pushed its own segments under the card's padding.
                      innerRadius="58%"
                      outerRadius="85%"
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
                      offset={isMobile ? 12 : 10}
                      wrapperStyle={{ outline: 'none', zIndex: 10 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const catName = t(`expenses.categories.${data.category}`, { defaultValue: data.category });
                          return (
                            <div className="rounded-2xl backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 px-3 py-2 shadow-2xl border border-slate-200/80 dark:border-zinc-800 text-[11px] sm:text-xs space-y-1 max-w-[220px]">
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
            <div key={item.category} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <span className="w-5 sm:w-6 text-center text-xs font-bold text-slate-400 shrink-0">
                  #{index + 1}
                </span>
                <div
                  className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-sm"
                  style={{ backgroundColor: getCategoryColor(item.category) }}
                />
                {/* On a phone the operation count moves under the category name; kept on
                    one line it squeezed the name down to an ellipsis. */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {t(`expenses.categories.${item.category}`, { defaultValue: item.category })}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate sm:hidden">
                    {t('statistics.operations', { count: item.count })} ({Math.round(item.percentage)}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs shrink-0">
                <span className="hidden sm:inline text-slate-500 dark:text-zinc-400">
                  {t('statistics.operations', { count: item.count })} ({Math.round(item.percentage)}%)
                </span>
                <span className="font-bold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
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
