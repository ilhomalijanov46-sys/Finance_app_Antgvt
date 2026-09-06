import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { CurrencyCode, LocaleCode } from '../types';
import { useTranslation } from 'react-i18next';

const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'UZS', 'EUR', 'RUB'];

/** Read the last-known currency synchronously, before the profile has loaded — without
 * it, every amount briefly rendered in USD on every reload for an account actually set
 * to UZS/EUR/RUB, then jumped once the profile arrived. Not a substitute for the real
 * profile value (used the instant it's available); just a better guess than a
 * hardcoded default while waiting for it. */
const readCachedCurrency = (): CurrencyCode | null => {
  try {
    const cached = localStorage.getItem('pft_currency');
    return (VALID_CURRENCIES as string[]).includes(cached || '') ? (cached as CurrencyCode) : null;
  } catch {
    return null;
  }
};

export const useCurrency = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const currency: CurrencyCode = user?.currency || readCachedCurrency() || 'USD';
  const locale: LocaleCode = (i18n.language as LocaleCode) || 'ru';

  const format = (amount: number, customCurrency?: CurrencyCode): string => {
    return formatCurrency(amount, customCurrency || currency, locale);
  };

  return {
    currency,
    format,
  };
};
