import { describe, it, expect } from 'vitest';
import { toDateKey, formatDate, formatDateLocalized, getMonthName, normalizeDecimalInput } from './formatters';

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

describe('getMonthName / uz month names (regression: browser ICU has no real Uzbek month data)', () => {
  // Chromium's bundled ICU falls back to a generic "M09"-style token for uz-UZ month
  // names in both a full and a headless Chromium build (verified directly against a
  // running dev server) — Node's own ICU gets it right, so this exact case can't be
  // reproduced by merely calling the browser's Intl API from this Node test suite. What
  // these tests lock in is our own lookup table and its wiring, so a later "just use
  // Intl directly" regression breaks loudly here rather than only in a real browser.
  it('uses a real Uzbek month name/abbreviation, not the browser-dependent Intl output', () => {
    expect(getMonthName(new Date(2026, 8, 15), 'uz', 'short')).toBe('sen');
    expect(getMonthName(new Date(2026, 8, 15), 'uz', 'long')).toBe('Sentabr');
    expect(getMonthName(new Date(2026, 0, 1), 'uz', 'long')).toBe('Yanvar');
  });

  it('still delegates to Intl for ru/en, which are not affected', () => {
    expect(getMonthName(new Date(2026, 8, 15), 'en', 'long')).toBe('September');
  });

  it('formatDateLocalized patches only the month token, keeping day/year formatting intact', () => {
    const result = formatDateLocalized(new Date(2026, 8, 6), 'uz', { day: 'numeric', month: 'short', year: 'numeric' });
    expect(result).toContain('sen');
    expect(result).toContain('6');
    expect(result).toContain('2026');
  });

  it('formatDate (string-based) applies the same patch', () => {
    const result = formatDate('2026-09-06', 'uz', { day: 'numeric', month: 'long', year: 'numeric' });
    expect(result).toContain('Sentabr');
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
