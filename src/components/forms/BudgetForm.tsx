import React, { useMemo } from 'react';
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

  const onSubmit = async (values: FormValues) => {
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
    }
  };

  const categoryOptions = expenseCategories.map((cat) => ({
    value: cat,
    label: t(`expenses.categories.${cat}`),
    color: getCategoryColor(cat),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label={t('expenses.category')}
        disabled={Boolean(initialData)}
        value={selectedCategory}
        onChange={(e) => setValue('category', e.target.value as ExpenseCategory, { shouldValidate: true, shouldDirty: true })}
        options={categoryOptions}
        error={errors.category?.message}
      />

      <Input
        label={t('budgets.limit')}
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
