import { CurrencyCode, LocaleCode } from '../types';

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
  const jsLocale = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat(jsLocale, options).format(date);
};

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
