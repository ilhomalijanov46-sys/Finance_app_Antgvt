import { Income, Expense, Budget, FinancialSummary, CategorySummary, MonthlyTrend, LocaleCode } from '../types';

export const calculateSummary = (
  incomes: Income[],
  expenses: Expense[],
  budgets: Budget[] = []
): FinancialSummary => {
  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0);
  const budgetUsagePercent = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    activeGoalsCount: 0,
    budgetUsagePercent,
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

export const getMonthlyTrends = (
  incomes: Income[],
  expenses: Expense[],
  monthsCount = 6,
  locale: LocaleCode = 'ru'
): MonthlyTrend[] => {
  const result: MonthlyTrend[] = [];
  const now = new Date();
  const jsLocale = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // Chart axis labels follow the interface language instead of always being English
    const label = d.toLocaleString(jsLocale, { month: 'short' });

    const monthIncomes = incomes
      .filter((inc) => inc.date.startsWith(yearMonth))
      .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

    const monthExpenses = expenses
      .filter((exp) => exp.date.startsWith(yearMonth))
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    result.push({
      month: label,
      income: monthIncomes,
      expense: monthExpenses,
      savings: Math.max(0, monthIncomes - monthExpenses),
    });
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
