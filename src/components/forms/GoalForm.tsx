import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Goal } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';
import { formatDbError } from '../../utils/dbErrors';
import { toDateKey, normalizeDecimalInput } from '../../utils/formatters';

const colorOptions = [
  '#0071e3', // Apple Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
];

// Matches the NUMERIC(14,2) columns.
const MAX_AMOUNT = 999_999_999_999.99;

const buildSchema = (t: TFunction) =>
  z
    .object({
      title: z
        .string()
        .trim()
        .min(2, { message: t('validation.titleMin') }),
      target_amount: z.coerce
        .number()
        .finite({ message: t('validation.targetPositive') })
        .positive({ message: t('validation.targetPositive') })
        .max(MAX_AMOUNT, { message: t('validation.amountTooLarge') }),
      current_amount: z.coerce
        .number()
        .finite({ message: t('validation.currentNonNegative') })
        .min(0, { message: t('validation.currentNonNegative') }),
      deadline: z.string().optional(),
      color: z.string().default('#0071e3'),
    })
    // A goal's progress cannot exceed its own target — reachable through this form
    // even though the deposit flow itself clamps at the target, since editing
    // current_amount directly bypasses that clamp.
    .refine((data) => data.current_amount <= data.target_amount, {
      message: t('validation.currentExceedsTarget'),
      path: ['current_amount'],
    });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

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
  // Validation messages follow the interface language, so the schema is rebuilt
  // whenever the language changes.
  const schema = useMemo(() => buildSchema(t), [t]);
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

  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      // An explicit null (not undefined) when the field is cleared: a PATCH body drops
      // undefined keys entirely, so the deadline column would otherwise never actually
      // be cleared once set.
      const deadline = values.deadline ? values.deadline : null;
      if (initialData) {
        await updateGoal(initialData.id, {
          title: values.title,
          target_amount: values.target_amount,
          current_amount: values.current_amount,
          deadline,
          color: values.color,
        });
      } else {
        await addGoal({
          user_id: user?.id || 'demo-user-777',
          title: values.title,
          target_amount: values.target_amount,
          current_amount: values.current_amount,
          deadline,
          color: values.color,
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to save goal:', err);
      setSubmitError(formatDbError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitError && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{submitError}</span>
        </div>
      )}

      <Input
        label={t('goals.name')}
        placeholder={t('goals.namePlaceholder')}
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label={t('goals.targetAmount')}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          error={errors.target_amount?.message}
          {...register('target_amount', {
            onChange: (e) => {
              e.target.value = normalizeDecimalInput(e.target.value);
            },
          })}
        />

        {/* Editing an existing goal's progress here would change the balance with no
            expense to show where the money went — unlike the "Deposit" flow, which
            records one. Only a brand-new goal (a starting point, not a movement of
            money) may set this directly. */}
        <Input
          label={t('goals.currentAmount')}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          error={errors.current_amount?.message}
          disabled={Boolean(initialData)}
          helperText={initialData ? t('goals.currentAmountLocked') : undefined}
          {...register('current_amount', {
            onChange: (e) => {
              e.target.value = normalizeDecimalInput(e.target.value);
            },
          })}
        />
      </div>

      <div className="space-y-1">
        <DatePicker
          label={t('goals.deadline')}
          value={deadlineValue}
          onChange={(e) => setValue('deadline', e.target.value, { shouldValidate: true, shouldDirty: true })}
          error={errors.deadline?.message}
        />
        {/* A past deadline is allowed (recording a goal that's already overdue is a
            legitimate use), but silently accepting it with no acknowledgement at all
            reads as the date picker having ignored the input. */}
        {!errors.deadline && deadlineValue && deadlineValue < toDateKey() && (
          <p className="text-xs text-amber-600 dark:text-amber-400 ml-0.5">
            {t('goals.deadlineInPast')}
          </p>
        )}
      </div>

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
