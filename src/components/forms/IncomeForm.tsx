import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Income, IncomeCategory, PaymentMethod } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { getCategoryColor } from '../../utils/formatters';
import { Plus, X, Tag } from 'lucide-react';

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

const schema = z.object({
  amount: z.coerce.number().positive({ message: 'Сумма должна быть больше 0' }),
  category: z.string().min(1, { message: 'Выберите категорию' }),
  payment_method: z.enum(['card', 'cash', 'transfer']),
  source: z.string().optional(),
  date: z.string().min(1, { message: 'Дата обязательна' }),
  time: z.string().optional(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
  const { addIncome, updateIncome, customCategories, addCustomCategory } = useData();
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
      category: initialData?.category || 'salary',
      payment_method: initialData?.payment_method || 'card',
      source: initialData?.source || '',
      date: initialData?.date || now.toISOString().split('T')[0],
      time: initialData?.time || currentTime,
      note: initialData?.note || '',
    },
  });

  const selectedCategory = watch('category');
  const selectedPaymentMethod = watch('payment_method');
  const selectedDate = watch('date');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const created = await addCustomCategory({
      name: newCatName.trim(),
      type: 'income',
      color: getCategoryColor(newCatName.trim()),
    });
    setValue('category', created.name, { shouldValidate: true, shouldDirty: true });
    setNewCatName('');
    setIsAddingCustomCategory(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (initialData) {
        await updateIncome(initialData.id, {
          amount: values.amount,
          category: values.category,
          payment_method: values.payment_method,
          source: values.source,
          date: values.date,
          time: values.time || currentTime,
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
          time: values.time || currentTime,
          note: values.note,
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save income:', err);
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
    { value: 'card', label: t('expenses.methods.card', { defaultValue: 'Банковская карта' }) },
    { value: 'cash', label: t('expenses.methods.cash', { defaultValue: 'Наличные' }) },
    { value: 'transfer', label: t('expenses.methods.transfer', { defaultValue: 'Банковский перевод' }) },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('incomes.amount')}
        type="number"
        step="any"
        placeholder="0.00"
        error={errors.amount?.message}
        {...register('amount')}
      />

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 ml-0.5">
            {t('incomes.category')}
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
                <Plus className="w-3 h-3" /> + Своя категория
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
              placeholder="Название категории (напр. 'Криптовалюта')"
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-zinc-100 outline-none placeholder:text-slate-400"
              autoFocus
            />
            <Button size="sm" variant="primary" type="button" onClick={handleCreateCategory} className="text-xs h-7 px-2.5">
              Добавить
            </Button>
          </div>
        )}

        <Select
          value={selectedCategory}
          onChange={(e) => setValue('category', e.target.value, { shouldValidate: true, shouldDirty: true })}
          options={categoryOptions}
          error={errors.category?.message}
        />
      </div>

      <Select
        label="Куда поступили деньги (Способ зачисления)"
        value={selectedPaymentMethod}
        onChange={(e) => setValue('payment_method', e.target.value as PaymentMethod, { shouldValidate: true, shouldDirty: true })}
        options={paymentMethodOptions}
        error={errors.payment_method?.message}
      />

      <Input
        label={t('incomes.source')}
        placeholder={t('incomes.sourcePlaceholder') || 'Например, TechCorp HQ или Клиент'}
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

        <Input
          label="Время операции"
          type="time"
          error={errors.time?.message}
          {...register('time')}
        />
      </div>

      <Input
        label={t('incomes.note')}
        placeholder={t('incomes.notePlaceholder')}
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
