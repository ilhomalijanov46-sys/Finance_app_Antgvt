import { describe, it, expect } from 'vitest';
import { toDateKey, formatDate, normalizeDecimalInput } from './formatters';

describe('toDateKey', () => {
  it('formats using local date components, not UTC (regression: toISOString() shifts a day east of UTC)', () => {
    // 2026-09-15 02:00 local time. toISOString() on this, in any timezone east of UTC,
    // would print 2026-09-14 — the exact bug this function exists to avoid.
    const localEarlyMorning = new Date(2026, 8, 15, 2, 0, 0);
    expect(toDateKey(localEarlyMorning)).toBe('2026-09-15');
  });

  it('zero-pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('formatDate', () => {
  it('falls back to the raw string for an empty value', () => {
    expect(formatDate('')).toBe('');
  });

  it('falls back to the raw string for a day that overflows into the next month (regression: silently showed the wrong day)', () => {
    // February never has a 30th; new Date(2026, 1, 30) would silently roll over to
    // March 2nd instead of failing.
    expect(formatDate('2026-02-30')).toBe('2026-02-30');
  });

  it('formats a real date', () => {
    const result = formatDate('2026-09-15', 'en', { day: 'numeric', month: 'short', year: 'numeric' });
    expect(result).toContain('2026');
    expect(result).toContain('15');
  });
});

describe('normalizeDecimalInput', () => {
  it('turns a locale decimal comma into a dot (regression: a native number input silently read this as 0)', () => {
    expect(normalizeDecimalInput('1500,50')).toBe('1500.50');
  });

  it('leaves a dot-separated value untouched', () => {
    expect(normalizeDecimalInput('1500.50')).toBe('1500.50');
  });

  it('leaves an integer untouched', () => {
    expect(normalizeDecimalInput('1500')).toBe('1500');
  });
});
