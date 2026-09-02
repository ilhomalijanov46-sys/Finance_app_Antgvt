import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Goal } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';

const colorOptions = [
  '#0071e3', // Apple Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
];

const schema = z.object({
  title: z.string().min(2, { message: 'Название должно содержать минимум 2 символа' }),
  target_amount: z.coerce.number().positive({ message: 'Сумма цели должна быть больше 0' }),
  current_amount: z.coerce.number().min(0, { message: 'Сумма не может быть отрицательной' }),
  deadline: z.string().optional(),
  color: z.string().default('#0071e3'),
});

type FormValues = z.infer<typeof schema>;

interface GoalFormProps {
  initialData?: Goal;
  onSuccess: () => void;
  onCancel: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { addGoal, updateGoal } = useData();
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
      title: initialData?.title || '',
      target_amount: initialData?.target_amount || ('' as unknown as number),
      current_amount: initialData?.current_amount || 0,
      deadline: initialData?.deadline || '',
      color: initialData?.color || '#0071e3',
    },
  });

  const selectedColor = watch('color');
  const deadlineValue = watch('deadline');

  const onSubmit = async (values: FormValues) => {
    try {
      if (initialData) {
        await updateGoal(initialData.id, {
          title: values.title,
          target_amount: values.target_amount,
          current_amount: values.current_amount,
          deadline: values.deadline || undefined,
          color: values.color,
        });
      } else {
        await addGoal({
          user_id: user?.id || 'demo-user-777',
          title: values.title,
          target_amount: values.target_amount,
          current_amount: values.current_amount,
          deadline: values.deadline || undefined,
          color: values.color,
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label={t('goals.name')}
        placeholder={t('goals.namePlaceholder')}
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label={t('goals.targetAmount')}
          type="number"
          step="any"
          placeholder="0.00"
          error={errors.target_amount?.message}
          {...register('target_amount')}
        />

        <Input
          label={t('goals.currentAmount')}
          type="number"
          step="any"
          placeholder="0.00"
          error={errors.current_amount?.message}
          {...register('current_amount')}
        />
      </div>

      <DatePicker
        label={t('goals.deadline')}
        value={deadlineValue}
        onChange={(e) => setValue('deadline', e.target.value, { shouldValidate: true, shouldDirty: true })}
        error={errors.deadline?.message}
      />

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 ml-0.5 tracking-tight">
          {t('goals.color')}
        </label>
        <div className="flex items-center gap-2.5">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c, { shouldValidate: true, shouldDirty: true })}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-blue-500 shadow-apple-sm' : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

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
