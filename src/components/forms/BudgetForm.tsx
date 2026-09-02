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
import { getCategoryColor } from '../../utils/formatters';

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

const buildSchema = (t: TFunction) =>
  z.object({
    category: z.string().min(1, { message: t('validation.categoryRequired') }),
    limit_amount: z.coerce.number().positive({ message: t('validation.limitPositive') }),
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
  const { saveBudget } = useData();
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

  const categoryOptions = expenseCategories.map((cat) => ({
    value: cat,
    label: t(`expenses.categories.${cat}`),
    color: getCategoryColor(cat),
  }));

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

      <Input
        label={t(`budgets.limitFor.${selectedPeriod}`)}
        type="number"
        step="any"
        placeholder="0.00"
        error={errors.limit_amount?.message}
        {...register('limit_amount')}
      />

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};
