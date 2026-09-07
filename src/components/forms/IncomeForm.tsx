import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Income, IncomeCategory, PaymentMethod } from '../../types';
import { toDateKey, normalizeDecimalInput } from '../../utils/formatters';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { TimePicker } from '../ui/TimePicker';
import { Button } from '../ui/Button';
import { getCategoryColor } from '../../utils/formatters';
import { AlertCircle } from 'lucide-react';
import { formatDbError } from '../../utils/dbErrors';

const defaultIncomeCategories: IncomeCategory[] = [
  'salary',
  'advance',
  'bonus',
  'freelance',
  'sale',
  'gift',
  'investments',
  'other',
];

// Matches the NUMERIC(14,2) column: Infinity used to pass `.positive()` outright, and
// an amount near or past the column's own limit would otherwise reach the database
// only to be rejected there with a raw Postgres overflow error.
const MAX_AMOUNT = 999_999_999_999.99;

const buildSchema = (t: TFunction) =>
  z.object({
    amount: z.coerce
      .number()
      .finite({ message: t('validation.amountPositive') })
      .positive({ message: t('validation.amountPositive') })
      .max(MAX_AMOUNT, { message: t('validation.amountTooLarge') }),
    category: z.string().min(1, { message: t('validation.categoryRequired') }),
    payment_method: z.enum(['card', 'cash', 'transfer']),
    source: z.string().optional(),
    date: z.string().min(1, { message: t('validation.dateRequired') }),
    time: z.string().optional(),
    note: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface IncomeFormProps {
  initialData?: Income;
  onSuccess: () => void;
  onCancel: () => void;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  // Validation messages follow the interface language, so the schema is rebuilt
  // whenever the language changes.
  const schema = useMemo(() => buildSchema(t), [t]);
  const { addIncome, updateIncome, customCategories } = useData();
  const { user } = useAuth();


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
      category: initialData?.category || 'salary',
      payment_method: initialData?.payment_method || 'card',
      source: initialData?.source || '',
      date: initialData?.date || toDateKey(now),
      time: initialData?.time || currentTime,
      note: initialData?.note || '',
    },
  });

  const selectedCategory = watch('category');
  const selectedPaymentMethod = watch('payment_method');
  const selectedDate = watch('date');
  const selectedTime = watch('time');

  const [submitError, setSubmitError] = useState<string | null>(null);


  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    // A new record with no time entered defaults to "now"; editing an existing record
    // and deliberately clearing the time field means "no time on this" and must not be
    // silently overwritten back to the current time.
    const time = values.time || (initialData ? undefined : currentTime);
    try {
      if (initialData) {
        await updateIncome(initialData.id, {
          amount: values.amount,
          category: values.category,
          payment_method: values.payment_method,
          source: values.source,
          date: values.date,
          time,
          note: values.note,
        });
      } else {
        await addIncome({
          user_id: user?.id || 'demo-user-777',
          amount: values.amount,
          category: values.category,
          payment_method: values.payment_method,
          source: values.source,
          date: values.date,
          time,
          note: values.note,
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save income:', err);
      setSubmitError(formatDbError(err));
    }
  };

  // Merge default + custom categories
  const userIncomeCategories = customCategories.filter((c) => c.type === 'income');
  
  const categoryOptions = [
    ...defaultIncomeCategories.map((cat) => ({
      value: cat,
      label: t(`incomes.categories.${cat}`),
      color: getCategoryColor(cat),
    })),
    ...userIncomeCategories.map((cat) => ({
      value: cat.name,
      label: cat.name,
      color: cat.color || getCategoryColor(cat.name),
    })),
  ];

  const paymentMethodOptions = [
    { value: 'card', label: t('expenses.methods.card') },
    { value: 'cash', label: t('expenses.methods.cash') },
    { value: 'transfer', label: t('expenses.methods.transfer') },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <Input
        label={t('incomes.amount')}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount', {
          onChange: (e) => {
            e.target.value = normalizeDecimalInput(e.target.value);
          },
        })}
      />

      <Select
        label={t('incomes.category')}
        value={selectedCategory}
        onChange={(e) => setValue('category', e.target.value, { shouldValidate: true, shouldDirty: true })}
        options={categoryOptions}
        error={errors.category?.message}
      />

      <Select
        label={t('incomes.depositMethod')}
        value={selectedPaymentMethod}
        onChange={(e) => setValue('payment_method', e.target.value as PaymentMethod, { shouldValidate: true, shouldDirty: true })}
        options={paymentMethodOptions}
        error={errors.payment_method?.message}
      />

      <Input
        label={t('incomes.source')}
        placeholder={t('incomes.sourcePlaceholder')}
        error={errors.source?.message}
        {...register('source')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DatePicker
          label={t('incomes.date')}
          value={selectedDate}
          onChange={(e) => setValue('date', e.target.value, { shouldValidate: true, shouldDirty: true })}
          error={errors.date?.message}
        />

        <TimePicker
          label={t('incomes.time')}
          value={selectedTime}
          onChange={(e) => setValue('time', e.target.value, { shouldValidate: true, shouldDirty: true })}
          error={errors.time?.message}
        />
      </div>

      <Input
        label={t('incomes.note')}
        placeholder={t('incomes.notePlaceholder')}
        error={errors.note?.message}
        {...register('note')}
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
