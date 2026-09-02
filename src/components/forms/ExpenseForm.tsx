import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { toDateKey } from '../../utils/formatters';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { getCategoryColor } from '../../utils/formatters';
import { Plus, X, Tag, AlertCircle } from 'lucide-react';
import { formatDbError } from '../../utils/dbErrors';

const defaultExpenseCategories: ExpenseCategory[] = [
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

const paymentMethods: PaymentMethod[] = ['card', 'cash', 'transfer'];

const buildSchema = (t: TFunction) =>
  z.object({
    amount: z.coerce.number().positive({ message: t('validation.amountPositive') }),
    category: z.string().min(1, { message: t('validation.categoryRequired') }),
    payment_method: z.enum(['card', 'cash', 'transfer']),
    date: z.string().min(1, { message: t('validation.dateRequired') }),
    time: z.string().optional(),
    note: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface ExpenseFormProps {
  initialData?: Expense;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  // Validation messages follow the interface language, so the schema is rebuilt
  // whenever the language changes.
  const schema = useMemo(() => buildSchema(t), [t]);
  const { addExpense, updateExpense, customCategories, addCustomCategory } = useData();
  const { user } = useAuth();

  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: initialData?.amount || ('' as unknown as number),
      category: initialData?.category || 'groceries',
      payment_method: initialData?.payment_method || 'card',
      date: initialData?.date || toDateKey(now),
      time: initialData?.time || currentTime,
      note: initialData?.note || '',
    },
  });

  const selectedCategory = watch('category');
  const selectedPaymentMethod = watch('payment_method');
  const selectedDate = watch('date');

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await addCustomCategory({
        name: newCatName.trim(),
        type: 'expense',
        color: getCategoryColor(newCatName.trim()),
      });
      setValue('category', created.name, { shouldValidate: true, shouldDirty: true });
      setNewCatName('');
      setIsAddingCustomCategory(false);
    } catch (err) {
      // Categories are stored server-side now, so creating one can fail. Say so rather
      // than leaving the input sitting there as if nothing happened.
      console.error('Failed to create category:', err);
      setSubmitError(formatDbError(err, 'categories.syncFailed'));
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      if (initialData) {
        await updateExpense(initialData.id, {
          amount: values.amount,
          category: values.category,
          payment_method: values.payment_method as PaymentMethod,
          date: values.date,
          time: values.time || currentTime,
          note: values.note,
        });
      } else {
        await addExpense({
          user_id: user?.id || 'demo-user-777',
          amount: values.amount,
          category: values.category,
          payment_method: values.payment_method as PaymentMethod,
          date: values.date,
          time: values.time || currentTime,
          note: values.note,
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save expense:', err);
      setSubmitError(formatDbError(err));
    }
  };

  // Merge default + custom expense categories
  const userExpenseCategories = customCategories.filter((c) => c.type === 'expense');

  const categoryOptions = [
    ...defaultExpenseCategories.map((cat) => ({
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

  const paymentOptions = paymentMethods.map((pm) => ({
    value: pm,
    label: t(`expenses.methods.${pm}`),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <Input
        label={t('expenses.amount')}
        type="number"
        step="any"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 ml-0.5">
            {t('expenses.category')}
          </label>
          <button
            type="button"
            onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
            className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {isAddingCustomCategory ? (
              <>
                <X className="w-3 h-3" /> {t('common.cancel')}
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" /> {t('categories.own')}
              </>
            )}
          </button>
        </div>

        {isAddingCustomCategory && (
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-blue-500/30 flex items-center gap-2 mb-2 animate-fade-in">
            <Tag className="w-4 h-4 text-blue-500 shrink-0" />
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder={t('categories.ownPlaceholderExpense')}
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-zinc-100 outline-none placeholder:text-slate-400"
              autoFocus
            />
            <Button size="sm" variant="primary" type="button" onClick={handleCreateCategory} className="text-xs h-7 px-2.5">
              {t('categories.add')}
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            value={selectedCategory}
            onChange={(e) => setValue('category', e.target.value, { shouldValidate: true, shouldDirty: true })}
            options={categoryOptions}
            error={errors.category?.message}
          />

          <Select
            value={selectedPaymentMethod}
            onChange={(e) => setValue('payment_method', e.target.value as PaymentMethod, { shouldValidate: true, shouldDirty: true })}
            options={paymentOptions}
            error={errors.payment_method?.message}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DatePicker
          label={t('expenses.date')}
          value={selectedDate}
          onChange={(e) => setValue('date', e.target.value, { shouldValidate: true, shouldDirty: true })}
          error={errors.date?.message}
        />

        <Input
          label={t('expenses.time')}
          type="time"
          error={errors.time?.message}
          {...register('time')}
        />
      </div>

      <Input
        label={t('expenses.note')}
        placeholder={t('expenses.notePlaceholder')}
        error={errors.note?.message}
        {...register('note')}
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
