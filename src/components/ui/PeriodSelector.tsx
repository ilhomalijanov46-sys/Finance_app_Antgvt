import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { LocaleCode } from '../../types';
import { toDateKey } from '../../utils/formatters';


export type PeriodType =
  | 'all'
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | '90days'
  | 'this_month'
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface PeriodSelectorProps {
  value: PeriodType;
  onChange: (period: PeriodType, customRange?: DateRange) => void;
  customRange?: DateRange;
  showAllOption?: boolean;
  className?: string;
  id?: string;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  customRange,
  showAllOption = true,
  className = '',
  id,
}) => {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language as LocaleCode) || 'ru';

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  // Range Picker calendar view states
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toDateKey(today), [today]);

  const [currentViewDate, setCurrentViewDate] = useState<Date>(() => {
    if (customRange?.startDate) {
      const [y, m] = customRange.startDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const [tempStartDate, setTempStartDate] = useState<string>(customRange?.startDate || '');
  const [tempEndDate, setTempEndDate] = useState<string>(customRange?.endDate || '');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync temp dates when modal opens or customRange changes
  useEffect(() => {
    if (isRangeModalOpen) {
      if (value === 'custom' && customRange?.startDate && customRange?.endDate) {
        setTempStartDate(customRange.startDate);
        setTempEndDate(customRange.endDate);
      } else {
        setTempStartDate('');
        setTempEndDate('');
      }
    }
  }, [isRangeModalOpen, value, customRange]);

  // Escape closes the range modal, then the dropdown
  useEffect(() => {
    if (!isRangeModalOpen && !isDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isRangeModalOpen) setIsRangeModalOpen(false);
      else setIsDropdownOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRangeModalOpen, isDropdownOpen]);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Helper date formatters
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: y !== today.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  };

  // Label for trigger button
  const triggerLabel = useMemo(() => {
    switch (value) {
      case 'all':
        return t('periods.all', { defaultValue: 'Все даты' });
      case 'today':
        return t('periods.today', { defaultValue: 'Сегодня' });
      case 'yesterday':
        return t('periods.yesterday', { defaultValue: 'Вчера' });
      case '7days':
        return t('periods.last7Days', { defaultValue: 'Последние 7 дней' });
      case '30days':
        return t('periods.last30Days', { defaultValue: 'Последние 30 дней' });
      case '90days':
        return t('periods.last90Days', { defaultValue: 'Последние 90 дней' });
      case 'this_month':
        return t('periods.thisMonth', { defaultValue: 'Этот месяц' });
      case 'custom':
        if (customRange?.startDate && customRange?.endDate) {
          if (customRange.startDate === customRange.endDate) {
            return formatShortDate(customRange.startDate);
          }
          return `${formatShortDate(customRange.startDate)} — ${formatShortDate(customRange.endDate)}`;
        }
        return t('periods.custom', { defaultValue: 'Свой период' });
      default:
        return t('periods.all', { defaultValue: 'Все даты' });
    }
  }, [value, customRange, t, locale]);

  // Options list for dropdown
  const options: { key: PeriodType; label: string }[] = useMemo(() => {
    const list: { key: PeriodType; label: string }[] = [];
    if (showAllOption) {
      list.push({ key: 'all', label: t('periods.all', { defaultValue: 'Все даты' }) });
    }
    list.push(
      { key: 'today', label: t('periods.today', { defaultValue: 'Сегодня' }) },
      { key: 'yesterday', label: t('periods.yesterday', { defaultValue: 'Вчера' }) },
      { key: '7days', label: t('periods.last7Days', { defaultValue: 'Последние 7 дней' }) },
      { key: '30days', label: t('periods.last30Days', { defaultValue: 'Последние 30 дней' }) },
      { key: '90days', label: t('periods.last90Days', { defaultValue: 'Последние 90 дней' }) },
      { key: 'this_month', label: t('periods.thisMonth', { defaultValue: 'Этот месяц' }) },
      { key: 'custom', label: t('periods.custom', { defaultValue: 'Свой период' }) }
    );
    return list;
  }, [showAllOption, t]);

  const handleSelectOption = (key: PeriodType) => {
    setIsDropdownOpen(false);
    if (key === 'custom') {
      setIsRangeModalOpen(true);
    } else {
      onChange(key);
    }
  };

  // Calendar navigation for custom modal
  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth();

  const prevMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const monthTitle = useMemo(() => {
    return new Intl.DateTimeFormat(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'long',
    }).format(currentViewDate);
  }, [currentViewDate, locale]);

  // Generate 42 days grid for viewMonth
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Preceding month days
    const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Trailing month days
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNum: d, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Click on date in Range Picker
  const handleDateClick = (dateStr: string) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // First click: start new selection
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else if (tempStartDate && !tempEndDate) {
      // Second click
      if (dateStr < tempStartDate) {
        setTempStartDate(dateStr);
        setTempEndDate('');
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  const handleApplyCustomRange = () => {
    const start = tempStartDate || todayStr;
    const end = tempEndDate || tempStartDate || todayStr;
    const range: DateRange = {
      startDate: start <= end ? start : end,
      endDate: start <= end ? end : start,
    };
    onChange('custom', range);
    setIsRangeModalOpen(false);
  };

  const weekDayHeaders = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

  return (
    <>
      {/* Dropdown Menu Trigger Container */}
      <div className={cn('relative inline-block', isDropdownOpen ? 'z-40' : 'z-10', className)} ref={dropdownRef}>
        <button
          id={id}
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            'flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 outline-none',
            'bg-slate-100/80 dark:bg-zinc-800/80 hover:bg-slate-200/70 dark:hover:bg-zinc-700/80',
            'border border-slate-200/90 dark:border-zinc-700/70 text-slate-900 dark:text-zinc-100 shadow-apple-sm',
            isDropdownOpen && 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-zinc-900'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">{triggerLabel}</span>
          </div>

          <motion.div
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400 dark:text-zinc-500 shrink-0"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Dropdown Menu (Photo 2 Style) */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 4, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 z-[100] mt-1.5 w-56 rounded-2xl p-1.5 backdrop-blur-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-2xl"
            >
              <div className="space-y-0.5">
                {options.map((opt) => {
                  const isSelected = value === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(opt.key)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left',
                        isSelected
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-bold'
                          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Range DatePicker Modal via createPortal */}
      {typeof document !== 'undefined' &&
        createPortal(
          // The layer that catches clicks is a plain div whose pointer-events depend only
          // on the open flag, never on an animation: a stalled Framer Motion animation
          // would otherwise leave an invisible full-screen shield over the whole page.
          <div
            className="fixed inset-0 z-[1000]"
            style={{ pointerEvents: isRangeModalOpen ? 'auto' : 'none' }}
          >
          <AnimatePresence>
            {isRangeModalOpen && (
              <motion.div
                key="period-range-overlay-wrapper"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto"
              >
                {/* Backdrop */}
                <div
                  onClick={() => setIsRangeModalOpen(false)}
                  className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
                />

                {/* Modal Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 340 }}
                  className="relative z-10 w-full max-w-[380px] rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-zinc-100 space-y-4"
                >
                  {/* Header with circular back & forward and Month > Year */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="w-9 h-9 rounded-full border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-apple-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold capitalize flex items-center gap-1 text-slate-900 dark:text-zinc-100">
                        {monthTitle} <span className="text-slate-400 font-normal">›</span>
                      </span>
                      <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                        {viewYear}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={nextMonth}
                      className="w-9 h-9 rounded-full border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shadow-apple-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day Labels */}
                  <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 dark:text-zinc-500 pt-1">
                    {weekDayHeaders.map((day) => (
                      <div key={day} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 42-Days Grid with Precision Connected Blue Range (Line appears only when both dates selected) */}
                  <div className="grid grid-cols-7 gap-y-1 text-xs">
                    {calendarDays.map((item, idx) => {
                      const isStart = Boolean(tempStartDate && item.dateStr === tempStartDate);
                      const isEnd = Boolean(tempEndDate && item.dateStr === tempEndDate);
                      const hasRealRange = Boolean(tempStartDate && tempEndDate && tempEndDate > tempStartDate);
                      const inRange = Boolean(hasRealRange && item.dateStr >= tempStartDate && item.dateStr <= tempEndDate);
                      const isMiddle = inRange && !isStart && !isEnd;
                      const colIndex = idx % 7; // 0 = Mon, 6 = Sun
                      const isStartOfWeek = colIndex === 0;
                      const isEndOfWeek = colIndex === 6;

                      return (
                        <div
                          key={`${item.dateStr}-${idx}`}
                          className="h-9 flex items-center justify-center relative select-none"
                        >
                          {/* Range connecting strip under button: only visible when BOTH start and end are chosen */}
                          {hasRealRange && isStart && !isEndOfWeek && (
                            <div className="absolute right-0 top-1 bottom-1 left-1/2 bg-blue-500/15 dark:bg-blue-500/25 z-0" />
                          )}
                          {hasRealRange && isEnd && !isStartOfWeek && (
                            <div className="absolute left-0 top-1 bottom-1 right-1/2 bg-blue-500/15 dark:bg-blue-500/25 z-0" />
                          )}
                          {isMiddle && (
                            <div
                              className={cn(
                                'absolute inset-y-1 inset-x-0 bg-blue-500/15 dark:bg-blue-500/25 z-0',
                                isStartOfWeek && 'rounded-l-full',
                                isEndOfWeek && 'rounded-r-full'
                              )}
                            />
                          )}

                          {/* Day Button */}
                          <button
                            type="button"
                            onClick={() => handleDateClick(item.dateStr)}
                            className={cn(
                              'h-8 w-8 rounded-full flex items-center justify-center font-medium transition-all duration-150 relative z-10',
                              (isStart || isEnd) &&
                                'bg-blue-600 dark:bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30 scale-105 ring-2 ring-blue-500/20',
                              isMiddle &&
                                'text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-500/20',
                              !inRange &&
                                !isStart &&
                                !isEnd &&
                                (item.isCurrentMonth
                                  ? 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                  : 'text-slate-300 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/40')
                            )}
                          >
                            {item.dayNum}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Info Banner (Project Blue Glass Style) */}
                  <div className="p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-slate-700 dark:text-zinc-300">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      {t('periods.maxPeriodHint', {
                        defaultValue: 'Максимально возможный период для отображения истории - 180 дней',
                      })}
                    </span>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsRangeModalOpen(false)}
                      className="h-11 rounded-2xl font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      {t('periods.close', { defaultValue: 'Закрыть' })}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyCustomRange}
                      className="h-11 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 active:scale-98 transition-all"
                    >
                      {t('periods.apply', { defaultValue: 'Применить' })}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>,
          document.body
        )}
    </>
  );
};
