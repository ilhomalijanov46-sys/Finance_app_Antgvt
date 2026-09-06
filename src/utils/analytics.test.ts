import { describe, it, expect } from 'vitest';
import { calculateSummary, getPeriodRange, filterByPeriod, countDaysInRange, getMonthlyTrendsForRange } from './analytics';
import { Income, Expense } from '../types';

// Fixed reference point so these tests don't depend on the day they happen to run.
const NOW = new Date(2026, 8, 15); // 2026-09-15 (month is 0-indexed)

describe('getPeriodRange', () => {
  it('"7days" spans exactly 7 calendar days including today (regression: used to span 8)', () => {
    const range = getPeriodRange('7days', undefined, NOW);
    expect(range).toEqual({ start: '2026-09-09', end: '2026-09-15' });
    expect(countDaysInRange(range!)).toBe(7);
  });

  it('"30days" spans exactly 30 days (regression: used to span 31)', () => {
    const range = getPeriodRange('30days', undefined, NOW);
    expect(countDaysInRange(range!)).toBe(30);
  });

  it('"90days" spans exactly 90 days (regression: used to span 91)', () => {
    const range = getPeriodRange('90days', undefined, NOW);
    expect(countDaysInRange(range!)).toBe(90);
  });

  it('"today" and "yesterday" are single-day ranges', () => {
    expect(getPeriodRange('today', undefined, NOW)).toEqual({ start: '2026-09-15', end: '2026-09-15' });
    expect(getPeriodRange('yesterday', undefined, NOW)).toEqual({ start: '2026-09-14', end: '2026-09-14' });
  });

  it('"this_month" runs from the 1st to today, not the whole calendar month', () => {
    expect(getPeriodRange('this_month', undefined, NOW)).toEqual({ start: '2026-09-01', end: '2026-09-15' });
  });

  it('"all" and an incomplete custom range mean "no filter"', () => {
    expect(getPeriodRange('all', undefined, NOW)).toBeNull();
    expect(getPeriodRange('custom', { startDate: '2026-01-01' }, NOW)).toBeNull();
    expect(getPeriodRange('custom', {}, NOW)).toBeNull();
  });

  it('a complete custom range passes through untouched', () => {
    expect(getPeriodRange('custom', { startDate: '2026-01-01', endDate: '2026-01-31' }, NOW)).toEqual({
      start: '2026-01-01',
      end: '2026-01-31',
    });
  });
});

describe('filterByPeriod', () => {
  const items = [{ date: '2026-09-08' }, { date: '2026-09-09' }, { date: '2026-09-15' }, { date: '2026-09-20' }];

  it('keeps only items inside the range, boundaries inclusive', () => {
    const range = getPeriodRange('7days', undefined, NOW)!;
    expect(filterByPeriod(items, range)).toEqual([{ date: '2026-09-09' }, { date: '2026-09-15' }]);
  });

  it('returns everything unfiltered when range is null', () => {
    expect(filterByPeriod(items, null)).toBe(items);
  });
});

describe('calculateSummary', () => {
  const income = (amount: number): Income => ({
    id: 'i', user_id: 'u', amount, category: 'salary', date: '2026-09-01',
  });
  const expense = (amount: number): Expense => ({
    id: 'e', user_id: 'u', amount, category: 'rent', payment_method: 'card', date: '2026-09-01',
  });

  it('reports a negative savings rate when spending exceeds income (regression: used to clamp to 0)', () => {
    const summary = calculateSummary([income(1000)], [expense(1500)]);
    expect(summary.netBalance).toBe(-500);
    expect(summary.savingsRate).toBeLessThan(0);
    expect(summary.savingsRate).toBeCloseTo(-50, 5);
  });

  it('clamps the rate at 100 but not at 0', () => {
    const summary = calculateSummary([income(1000)], [expense(0)]);
    expect(summary.savingsRate).toBe(100);
  });

  it('is 0 with no income at all (avoids a divide-by-zero NaN)', () => {
    const summary = calculateSummary([], [expense(200)]);
    expect(summary.savingsRate).toBe(0);
    expect(summary.netBalance).toBe(-200);
  });
});

describe('getMonthlyTrendsForRange', () => {
  const incs: Income[] = [
    { id: 'i1', user_id: 'u', amount: 100, category: 'salary', date: '2026-07-10' },
    { id: 'i2', user_id: 'u', amount: 200, category: 'salary', date: '2026-08-10' },
    { id: 'i3', user_id: 'u', amount: 300, category: 'salary', date: '2026-09-10' },
  ];
  const exps: Expense[] = [
    { id: 'e1', user_id: 'u', amount: 50, category: 'rent', payment_method: 'card', date: '2026-09-05' },
  ];

  it('follows the selected period range instead of always trailing 6 months (regression: L5)', () => {
    // "this_month"-shaped range: just September.
    const result = getMonthlyTrendsForRange(incs, exps, { start: '2026-09-01', end: '2026-09-15' }, 'en');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ income: 300, expense: 50 });
  });

  it('spans multiple months when the range crosses a month boundary', () => {
    const result = getMonthlyTrendsForRange(incs, exps, { start: '2026-07-01', end: '2026-09-15' }, 'en');
    expect(result.map((r) => r.income)).toEqual([100, 200, 300]);
  });

  it('falls back to trailing 6 months for "all" (range: null), same as before', () => {
    const result = getMonthlyTrendsForRange(incs, exps, null, 'en');
    expect(result).toHaveLength(6);
  });
});
