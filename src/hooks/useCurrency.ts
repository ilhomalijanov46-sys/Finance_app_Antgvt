import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatters';
import { CurrencyCode, LocaleCode } from '../types';
import { useTranslation } from 'react-i18next';

export const useCurrency = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const currency: CurrencyCode = user?.currency || 'USD';
  const locale: LocaleCode = (i18n.language as LocaleCode) || 'ru';

  const format = (amount: number, customCurrency?: CurrencyCode): string => {
    return formatCurrency(amount, customCurrency || currency, locale);
  };

  return {
    currency,
    format,
  };
};
