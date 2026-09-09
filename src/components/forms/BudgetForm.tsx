import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Budget, ExpenseCategory } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import { formatDbError } from '../../utils/dbErrors';
import { getCategoryColor, normalizeDecimalInput } from '../../utils/formatters';
import { fromDecimalInput } from '../../utils/validation';

const expenseCategories: ExpenseCategory[] = [
  'groceries',
  'dining',
  'transport',
  'taxi',
  'internet',
  'mobile',
  'utilities',
  'rent',
  'loans',
  'subscriptions',
  'entertainment',
  'clothing',
  'health',
  'home',
  'travel',
  'pets',
  'miscellaneous',
];

// Matches the NUMERIC(14,2) column.
const MAX_AMOUNT = 999_999_999_999.99;

const buildSchema = (t: TFunction) =>
  z.object({
    category: z.string().min(1, { message: t('validation.categoryRequired') }),
    limit_amount: fromDecimalInput(
      z.coerce
        // Without this, anything that will not parse as a number falls back to zod's own
        // untranslated "Expected number, received nan".
        .number({ invalid_type_error: t('validation.amountInvalid') })
        .finite({ message: t('validation.limitPositive') })
        .positive({ message: t('validation.limitPositive') })
        .max(MAX_AMOUNT, { message: t('validation.amountTooLarge') })
    ),
    period: z.enum(['monthly', 'weekly', 'yearly']),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface BudgetFormProps {
  initialData?: Budget;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  // Validation messages follow the interface language, so the schema is rebuilt
  // whenever the language changes.
  const schema = useMemo(() => buildSchema(t), [t]);
  const { saveBudget, budgets, customCategories } = useData();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: initialData?.category || 'groceries',
      limit_amount: initialData?.limit_amount || ('' as unknown as number),
      period: initialData?.period || 'monthly',
    },
  });

  const selectedCategory = watch('category');
  const selectedPeriod = watch('period');

  const [submitError, setSubmitError] = useState<string | null>(null);

  // Creating a budget for a (category, period) pair that already has one silently
  // replaces it — createOrUpdate upserts on that pair. Editing is unaffected: its
  // category is locked (see the Select below), so it can only ever match itself.
  const collidesWithExisting =
    !initialData && budgets.some((b) => b.category === selectedCategory && b.period === selectedPeriod);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await saveBudget({
        user_id: user?.id || 'demo-user-777',
        category: values.category as ExpenseCategory,
        limit_amount: values.limit_amount,
        period: values.period as 'monthly' | 'weekly' | 'yearly',
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to save budget:', err);
      setSubmitError(formatDbError(err));
    }
  };

  // Previously only the built-in categories could get a budget at all — a user's own
  // expense category (created in the Categories manager) had no way into this list.
  const userExpenseCategories = customCategories.filter((c) => c.type === 'expense');
  const categoryOptions = [
    ...expenseCategories.map((cat) => ({
      value: cat,
      label: t(`expenses.categories.${cat}`),
      color: getCategoryColor(cat),
    })),
    ...userExpenseCategories.map((cat) => ({
      value: cat.name,
      label: cat.name,
      color: cat.color || getCategoryColor(cat.name),
    })),
  ];

  // The period was in the schema but had no control, so every budget was silently saved
  // as monthly and the Budgets page measured all of them over the current month.
  const periodOptions = (['weekly', 'monthly', 'yearly'] as const).map((p) => ({
    value: p,
    label: t(`budgets.periods.${p}`),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <Select
        label={t('expenses.category')}
        disabled={Boolean(initialData)}
        value={selectedCategory}
        onChange={(e) => setValue('category', e.target.value as ExpenseCategory, { shouldValidate: true, shouldDirty: true })}
        options={categoryOptions}
        error={errors.category?.message}
      />

      <Select
        label={t('budgets.period')}
        value={selectedPeriod}
        onChange={(e) =>
          setValue('period', e.target.value as 'monthly' | 'weekly' | 'yearly', {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
        options={periodOptions}
        error={errors.period?.message}
      />

      {collidesWithExisting && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-start gap-1.5 -mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{t('budgets.willReplaceExisting')}</span>
        </p>
      )}

      <Input
        label={t(`budgets.limitFor.${selectedPeriod}`)}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        error={errors.limit_amount?.message}
        {...register('limit_amount', {
          onChange: (e) => {
            e.target.value = normalizeDecimalInput(e.target.value);
          },
        })}
      />

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full sm:w-auto">
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};
