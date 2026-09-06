import { CurrencyCode, LocaleCode } from '../types';

// Chromium's bundled ICU data has no real Uzbek month names — Intl.DateTimeFormat and
// Date.prototype.toLocaleString both fall back to a generic "M09"-style token for
// 'uz-UZ' month names/abbreviations instead of an actual name, in both a full and a
// headless Chromium build (verified directly; Node's own ICU gets it right — "6-sen,
// 2026" — so this is specifically a browser gap, not malformed input on our end). Every
// place that needs an Uzbek month name uses this table instead of depending on the
// browser's ICU completeness.
const UZ_MONTHS_LONG = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];
const UZ_MONTHS_SHORT = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

/** A month name/abbreviation that works regardless of the browser's ICU completeness
 * for the given locale (see the note on UZ_MONTHS_LONG above). */
export const getMonthName = (date: Date, locale: LocaleCode = 'ru', style: 'short' | 'long' = 'long'): string => {
  if (locale === 'uz') {
    return (style === 'short' ? UZ_MONTHS_SHORT : UZ_MONTHS_LONG)[date.getMonth()];
  }
  const jsLocale = locale === 'ru' ? 'ru-RU' : 'en-US';
  return date.toLocaleString(jsLocale, { month: style });
};

export const formatCurrency = (
  amount: number,
  currency: CurrencyCode = 'USD',
  locale: LocaleCode = 'ru'
): string => {
  const isUzbek = locale === 'uz';
  const jsLocale = isUzbek ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';

  switch (currency) {
    case 'USD':
      return new Intl.NumberFormat(jsLocale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);

    case 'EUR':
      return new Intl.NumberFormat(jsLocale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);

    case 'RUB':
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);

    case 'UZS':
      // UZS custom clean representation
      const formattedNum = new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 0,
      }).format(amount);
      return `${formattedNum} UZS`;

    default:
      return `${amount} ${currency}`;
  }
};

// Local calendar day as YYYY-MM-DD. Dates in this app are local day keys — the pickers
// build them from local components and formatDate parses them back as local — so
// `toISOString()` must never be used to derive one: east of UTC it returns the previous
// day during the early morning (02:00 in UTC+5 is still "yesterday" in UTC).
export const toDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Formats a Date directly (as opposed to formatDate below, which parses a YYYY-MM-DD
 * string first) — shared by every month/year header in Calendar, DatePicker and
 * PeriodSelector, so the Uzbek month-name patch lives in one place. */
export const formatDateLocalized = (
  date: Date,
  locale: LocaleCode = 'ru',
  options: Intl.DateTimeFormatOptions
): string => {
  const jsLocale = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
  const formatter = new Intl.DateTimeFormat(jsLocale, options);

  if (locale === 'uz' && (options.month === 'long' || options.month === 'short')) {
    // formatToParts keeps Intl's (correct) day/year formatting and ordering, patching in
    // our own month name for just the one token Chromium's ICU gets wrong — see
    // getMonthName's doc comment.
    const style = options.month;
    return formatter
      .formatToParts(date)
      .map((part) => (part.type === 'month' ? getMonthName(date, locale, style) : part.value))
      .join('');
  }

  return formatter.format(date);
};

export const formatDate = (
  dateString: string,
  locale: LocaleCode = 'ru',
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }
): string => {
  if (!dateString) return '';
  let date: Date;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    date = new Date(y, m - 1, d);
    // The Date constructor silently rolls an out-of-range day into the next month
    // instead of failing (new Date(2026, 1, 30) is March 2nd) — this catches that and
    // falls back to showing the raw string rather than a wrong, differently-numbered
    // day with no indication anything was off.
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return dateString;
    }
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return dateString;

  return formatDateLocalized(date, locale, options);
};

// Amount inputs are type="text" with inputMode="decimal" rather than type="number"
// specifically so this can normalize a locale decimal comma ("1500,50") to a dot before
// it reaches zod's z.coerce.number() — a native <input type="number"> either rejects
// the comma keystroke outright or (per the HTML spec) reports .value as "" for a string
// that doesn't parse as a number, silently turning the typed amount into 0.
export const normalizeDecimalInput = (value: string): string => value.replace(',', '.');

export const formatDateTime = (
  dateString: string,
  timeString?: string,
  locale: LocaleCode = 'ru'
): string => {
  const formattedDate = formatDate(dateString, locale);
  if (!timeString) return formattedDate;
  return `${formattedDate} • ${timeString}`;
};

export const formatAxisValue = (amount: number, currency: CurrencyCode = 'USD'): string => {
  const abs = Math.abs(amount);
  let formatted = '';
  
  if (abs >= 1_000_000_000) {
    formatted = `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  } else if (abs >= 1_000_000) {
    formatted = `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (abs >= 1_000) {
    formatted = `${(amount / 1_000).toFixed(0)}k`;
  } else {
    formatted = `${amount}`;
  }

  switch (currency) {
    case 'USD':
      return `$${formatted}`;
    case 'EUR':
      return `€${formatted}`;
    case 'RUB':
      return `${formatted} ₽`;
    case 'UZS':
      // No suffix: "240k UZS" wraps in the axis gutter, and the tooltip already spells
      // the currency out.
      return formatted;
    default:
      return `${formatted} ${currency}`;
  }
};

export const formatShortDate = (dateString: string, locale: LocaleCode = 'ru'): string => {
  return formatDate(dateString, locale, { month: 'short', day: 'numeric' });
};

export const formatPercentage = (val: number): string => {
  return `${Math.round(val * 10) / 10}%`;
};

// Generate consistent vibrant color for custom categories
export const getCategoryColor = (category: string, customColor?: string): string => {
  if (customColor) return customColor;

  const colorMap: Record<string, string> = {
    // Incomes
    salary: '#10b981',
    advance: '#06b6d4',
    bonus: '#3b82f6',
    freelance: '#8b5cf6',
    sale: '#f59e0b',
    gift: '#ec4899',
    investments: '#14b8a6',
    other: '#6b7280',
    // Expenses
    groceries: '#10b981',
    dining: '#f97316',
    transport: '#3b82f6',
    taxi: '#eab308',
    internet: '#06b6d4',
    mobile: '#8b5cf6',
    utilities: '#64748b',
    rent: '#6366f1',
    loans: '#ef4444',
    subscriptions: '#d946ef',
    entertainment: '#ec4899',
    clothing: '#f43f5e',
    health: '#14b8a6',
    home: '#84cc16',
    travel: '#0ea5e9',
    pets: '#a855f7',
    miscellaneous: '#94a3b8',
    transfer: '#0071e3',
    savings: '#0071e3',
  };

  if (colorMap[category]) {
    return colorMap[category];
  }

  // Consistent pastel/vibrant palette for any custom user category
  const palette = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#f43f5e', '#14b8a6', '#84cc16', '#a855f7',
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
};
