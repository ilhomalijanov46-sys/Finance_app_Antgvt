import { Income, Expense, Budget, FinancialSummary, CategorySummary, MonthlyTrend, LocaleCode } from '../types';
import { toDateKey, getMonthName } from './formatters';

/**
 * `budgets` is still accepted (and ignored) so the many call sites keep compiling: the
 * summary used to carry a budgetUsagePercent that divided *lifetime* expenses by the sum
 * of every limit regardless of its period — weekly, monthly and yearly added together —
 * a number that could only grow and meant nothing. Per-budget usage is computed properly
 * on the Budgets page, which measures each budget over its own period.
 */
export const calculateSummary = (
  incomes: Income[],
  expenses: Expense[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _budgets: Budget[] = []
): FinancialSummary => {
  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;
  // Overspending must show as a negative rate, not disappear: clamping the floor to 0
  // made a month where expenses exceeded income look identical to a month with exactly
  // zero savings — the one number meant to warn the user about exactly this hid it.
  const savingsRate = totalIncome > 0 ? Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    activeGoalsCount: 0,
  };
};

export const getExpensesByCategory = (expenses: Expense[]): CategorySummary[] => {
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const map: Record<string, { total: number; count: number }> = {};

  for (const exp of expenses) {
    if (!map[exp.category]) {
      map[exp.category] = { total: 0, count: 0 };
    }
    map[exp.category].total += Number(exp.amount || 0);
    map[exp.category].count += 1;
  }

  const list: CategorySummary[] = Object.entries(map).map(([category, val]) => ({
    category,
    total: val.total,
    percentage: totalExpense > 0 ? (val.total / totalExpense) * 100 : 0,
    count: val.count,
  }));

  return list.sort((a, b) => b.total - a.total);
};

export const getIncomesByCategory = (incomes: Income[]): CategorySummary[] => {
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const map: Record<string, { total: number; count: number }> = {};

  for (const inc of incomes) {
    if (!map[inc.category]) {
      map[inc.category] = { total: 0, count: 0 };
    }
    map[inc.category].total += Number(inc.amount || 0);
    map[inc.category].count += 1;
  }

  return Object.entries(map)
    .map(([category, val]) => ({
      category,
      total: val.total,
      percentage: totalIncome > 0 ? (val.total / totalIncome) * 100 : 0,
      count: val.count,
    }))
    .sort((a, b) => b.total - a.total);
};

const buildMonthBucket = (
  d: Date,
  incomes: Income[],
  expenses: Expense[],
  locale: LocaleCode
): MonthlyTrend => {
  const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // Chart axis labels follow the interface language instead of always being English
  const label = getMonthName(d, locale, 'short');

  const monthIncomes = incomes
    .filter((inc) => inc.date.startsWith(yearMonth))
    .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

  const monthExpenses = expenses
    .filter((exp) => exp.date.startsWith(yearMonth))
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  return {
    month: label,
    income: monthIncomes,
    expense: monthExpenses,
    // Not clamped to 0: a month that overspent should be able to show it as negative
    // savings wherever this field ends up rendered, consistent with calculateSummary's
    // savingsRate.
    savings: monthIncomes - monthExpenses,
  };
};

export const getMonthlyTrends = (
  incomes: Income[],
  expenses: Expense[],
  monthsCount = 6,
  locale: LocaleCode = 'ru'
): MonthlyTrend[] => {
  const result: MonthlyTrend[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    result.push(buildMonthBucket(new Date(now.getFullYear(), now.getMonth() - i, 1), incomes, expenses, locale));
  }

  return result;
};

/**
 * Same shape as getMonthlyTrends, but the month range follows a transaction-list period
 * filter (see getPeriodRange) instead of always trailing 6 months from today —
 * Statistics' "income vs expense" chart used to show a fixed 6-month window no matter
 * what period was selected above it, silently disagreeing with the KPI cards on the
 * same page. `range: null` ("all") has no month range to anchor to, so it falls back to
 * the previous trailing-6-months default.
 */
export const getMonthlyTrendsForRange = (
  incomes: Income[],
  expenses: Expense[],
  range: { start: string; end: string } | null,
  locale: LocaleCode = 'ru'
): MonthlyTrend[] => {
  if (!range) return getMonthlyTrends(incomes, expenses, 6, locale);

  const [sy, sm] = range.start.split('-').map(Number);
  const [ey, em] = range.end.split('-').map(Number);
  const result: MonthlyTrend[] = [];
  let cursor = new Date(sy, sm - 1, 1);
  const last = new Date(ey, em - 1, 1);
  // A custom range is capped at 180 days (PeriodSelector's own MAX_RANGE_DAYS), so this
  // is a generous safety net, not something normal usage should ever hit.
  let guard = 0;
  while (cursor <= last && guard < 24) {
    result.push(buildMonthBucket(cursor, incomes, expenses, locale));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    guard++;
  }
  return result;
};


export interface TrendComparison {
  /** Signed change against the previous period, in percent. */
  value: number;
  /** Whether the change is good news for the user (income up, spending down). */
  isPositive: boolean;
}

const sumInMonth = (items: { date: string; amount: number }[], yearMonth: string): number =>
  items
    .filter((item) => item.date.startsWith(yearMonth))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

const yearMonthKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

/**
 * Month-over-month change for the two headline KPI cards. Returns null when the previous
 * month holds nothing to compare against — a percentage off a zero base is not a number
 * the user can act on, so the card shows no badge at all rather than a made-up one.
 */
export const getMonthOverMonthTrends = (
  incomes: Income[],
  expenses: Expense[],
  now: Date = new Date()
): { income: TrendComparison | null; expense: TrendComparison | null } => {
  const currentKey = yearMonthKey(now);
  const previousKey = yearMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const change = (current: number, previous: number, higherIsBetter: boolean): TrendComparison | null => {
    if (previous <= 0) return null;
    const value = Math.round(((current - previous) / previous) * 1000) / 10;
    return { value, isPositive: higherIsBetter ? value >= 0 : value <= 0 };
  };

  return {
    income: change(sumInMonth(incomes, currentKey), sumInMonth(incomes, previousKey), true),
    expense: change(sumInMonth(expenses, currentKey), sumInMonth(expenses, previousKey), false),
  };
};

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

/**
 * Inclusive [start, end] day keys of the period a budget is measured over, anchored on
 * today. Weeks start on Monday, matching the calendar grids elsewhere in the app.
 */
export const getBudgetPeriodRange = (
  period: BudgetPeriod = 'monthly',
  now: Date = new Date()
): { start: string; end: string; daysTotal: number; daysLeft: number } => {
  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let startDate: Date;
  let endDate: Date;

  if (period === 'weekly') {
    const weekdayFromMonday = (now.getDay() + 6) % 7;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekdayFromMonday);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
  } else if (period === 'yearly') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysTotal = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  const daysLeft = Math.max(
    1,
    Math.round(
      (endDate.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / msPerDay
    ) + 1
  );

  return { start: key(startDate), end: key(endDate), daysTotal, daysLeft };
};

/** The transaction-list period filter used on Statistics/Expenses/Incomes. Kept as a
 * loose string union rather than importing PeriodSelector's PeriodType, to avoid a
 * utils -> component import; the two are kept in sync by hand. */
export type TransactionPeriod =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | '90days'
  | 'this_month'
  | 'custom';

/**
 * Inclusive [start, end] day-key range for a transaction-list period filter, or `null`
 * for "no filter" (all-time, or a custom range not yet fully picked). "N days" means
 * exactly N calendar days including today — so "7 days" subtracts 6, not 7, from
 * today's date. The previous `- 7` off-by-one made every "N days" filter (and the
 * per-day averages computed from it) actually cover N+1 days.
 */
export const getPeriodRange = (
  period: TransactionPeriod,
  customRange?: { startDate?: string; endDate?: string },
  now: Date = new Date()
): { start: string; end: string } | null => {
  const today = toDateKey(now);
  const back = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return toDateKey(d);
  };

  switch (period) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const key = back(1);
      return { start: key, end: key };
    }
    case '7days':
      return { start: back(6), end: today };
    case '30days':
      return { start: back(29), end: today };
    case '90days':
      return { start: back(89), end: today };
    case 'this_month': {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      return { start, end: today };
    }
    case 'custom':
      return customRange?.startDate && customRange?.endDate
        ? { start: customRange.startDate, end: customRange.endDate }
        : null;
    case 'all':
    default:
      return null;
  }
};

/** Filters items with a `date` field down to a period range from getPeriodRange(),
 * comparing the YYYY-MM-DD strings directly — safe because zero-padded ISO dates sort
 * lexicographically in calendar order. `range === null` returns the list unfiltered. */
export const filterByPeriod = <T extends { date: string }>(
  items: T[],
  range: { start: string; end: string } | null
): T[] => (range ? items.filter((item) => item.date >= range.start && item.date <= range.end) : items);

/** The number of calendar days a period range actually spans — the denominator for a
 * correct "average per day", matched to what filterByPeriod above just selected. */
export const countDaysInRange = (range: { start: string; end: string }): number => {
  const [sy, sm, sd] = range.start.split('-').map(Number);
  const [ey, em, ed] = range.end.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);
};
