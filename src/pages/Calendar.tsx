import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../context/DataContext';
import { useCurrency } from '../hooks/useCurrency';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { formatDate, toDateKey } from '../utils/formatters';
import { LocaleCode } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';

export const Calendar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { incomes, expenses } = useData();
  const { format } = useCurrency();
  const locale = (i18n.language as LocaleCode) || 'ru';

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fast Navigation handlers
  const prevYear = () => {
    setCurrentDate(new Date(year - 1, month, 1));
  };

  const nextYear = () => {
    setCurrentDate(new Date(year + 1, month, 1));
  };

  const prevPeriod = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextPeriod = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const setSpecificMonth = (mIdx: number) => {
    setCurrentDate(new Date(year, mIdx, 1));
  };

  const setSpecificYear = (y: number) => {
    setCurrentDate(new Date(y, month, 1));
  };

  // Month and Year selector options
  const monthsList = useMemo(() => {
    const list = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(year, m, 1);
      list.push({
        index: m,
        name: d.toLocaleString(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long' }),
      });
    }
    return list;
  }, [year, locale]);

  const yearsList = useMemo(() => {
    const currentY = new Date().getFullYear();
    const list = [];
    for (let y = currentY - 6; y <= currentY + 6; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Build days for month view - ALWAYS 42 cells (6 full rows)
  const monthDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const startOffset = (firstDayIndex + 6) % 7; // Mon is 0

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];

    // 1. Preceding month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayIncomes = incomes.filter((inc) => inc.date === dateStr);
      const dayExpenses = expenses.filter((e) => e.date === dateStr);
      const totalInc = dayIncomes.reduce((s, inc) => s + Number(inc.amount || 0), 0);
      const totalExp = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        incomes: dayIncomes,
        expenses: dayExpenses,
        totalInc,
        totalExp,
        net: totalInc - totalExp,
        hasSubscription: dayExpenses.some((e) => e.category === 'subscriptions'),
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayIncomes = incomes.filter((inc) => inc.date === dateStr);
      const dayExpenses = expenses.filter((e) => e.date === dateStr);
      const totalInc = dayIncomes.reduce((s, inc) => s + Number(inc.amount || 0), 0);
      const totalExp = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        incomes: dayIncomes,
        expenses: dayExpenses,
        totalInc,
        totalExp,
        net: totalInc - totalExp,
        hasSubscription: dayExpenses.some((e) => e.category === 'subscriptions'),
      });
    }

    // 3. Trailing month days to reach 42 cells
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayIncomes = incomes.filter((inc) => inc.date === dateStr);
      const dayExpenses = expenses.filter((e) => e.date === dateStr);
      const totalInc = dayIncomes.reduce((s, inc) => s + Number(inc.amount || 0), 0);
      const totalExp = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        incomes: dayIncomes,
        expenses: dayExpenses,
        totalInc,
        totalExp,
        net: totalInc - totalExp,
        hasSubscription: dayExpenses.some((e) => e.category === 'subscriptions'),
      });
    }

    return days;
  }, [year, month, incomes, expenses]);

  // Selected day items for modal
  const selectedDayData = useMemo(() => {
    if (!selectedDayString) return null;
    const dayIncomes = incomes.filter((i) => i.date === selectedDayString);
    const dayExpenses = expenses.filter((e) => e.date === selectedDayString);
    const totalInc = dayIncomes.reduce((s, i) => s + Number(i.amount || 0), 0);
    const totalExp = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

    return {
      dateStr: selectedDayString,
      incomes: dayIncomes,
      expenses: dayExpenses,
      totalInc,
      totalExp,
      net: totalInc - totalExp,
    };
  }, [selectedDayString, incomes, expenses]);

  const monthTitle = currentDate.toLocaleString(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDayLabels = (t('calendar.weekDays', { returnObjects: true }) as string[]) || [
    'Пн',
    'Вт',
    'Ср',
    'Чт',
    'Пт',
    'Сб',
    'Вс',
  ];

  const todayStr = toDateKey();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Navigation and Fast Year/Month Jump */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 capitalize">
              {monthTitle}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            {t('calendar.subtitle')}
          </p>
        </div>

        {/* Quick Selectors & Navigation Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Month Selector */}
          <select
            value={month}
            onChange={(e) => setSpecificMonth(Number(e.target.value))}
            className="h-9 px-3 text-xs font-semibold rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 text-slate-900 dark:text-zinc-100 outline-none shadow-apple-sm capitalize"
          >
            {monthsList.map((m) => (
              <option key={m.index} value={m.index} className="capitalize dark:bg-zinc-900">
                {m.name}
              </option>
            ))}
          </select>

          {/* Quick Year Selector */}
          <select
            value={year}
            onChange={(e) => setSpecificYear(Number(e.target.value))}
            className="h-9 px-3 text-xs font-semibold rounded-xl bg-white/80 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 text-slate-900 dark:text-zinc-100 outline-none shadow-apple-sm"
          >
            {yearsList.map((y) => (
              <option key={y} value={y} className="dark:bg-zinc-900">
                {y} г.
              </option>
            ))}
          </select>

          {/* Today button */}
          <Button size="sm" variant="glass" onClick={goToToday} className="h-9 font-medium">
            {t('calendar.today')}
          </Button>

          {/* Step buttons */}
          <div className="flex items-center rounded-xl bg-slate-200/60 dark:bg-zinc-800/80 p-0.5 border border-slate-300/30 dark:border-zinc-700/50 shadow-apple-sm">
            <button
              type="button"
              title="Предыдущий год"
              onClick={prevYear}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Предыдущий месяц"
              onClick={prevPeriod}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Следующий месяц"
              onClick={nextPeriod}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Следующий год"
              onClick={nextYear}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Card - FIXED 42 Cells, NO JUMPING */}
      <Card variant="glass" padding="sm" className="overflow-hidden shadow-apple-md">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 border-b border-slate-200/60 dark:border-zinc-800/60 text-center py-2.5">
          {weekDayLabels.map((day) => (
            <div
              key={day}
              className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Cells (Always 6 rows x 7 cols) */}
        <div className="grid grid-cols-7 gap-px bg-slate-200/40 dark:bg-zinc-800/40">
          {monthDays.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;
            const hasActivity = cell.totalInc > 0 || cell.totalExp > 0;

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                onClick={() => setSelectedDayString(cell.dateStr)}
                className={`min-h-[90px] sm:min-h-[105px] p-2 sm:p-2.5 flex flex-col justify-between transition-colors cursor-pointer ${
                  cell.isCurrentMonth
                    ? 'bg-white/90 dark:bg-zinc-900/90 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                    : 'bg-slate-50/40 dark:bg-zinc-950/40 opacity-40 hover:opacity-75 hover:bg-slate-100/50 dark:hover:bg-zinc-800/40'
                } ${isToday ? 'ring-2 ring-inset ring-blue-500 font-bold' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-md px-1.5 py-0.5 ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : cell.isCurrentMonth
                        ? 'text-slate-700 dark:text-zinc-300'
                        : 'text-slate-400 dark:text-zinc-600'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.hasSubscription && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" title="Подписка" />
                  )}
                </div>

                {hasActivity && (
                  <div className="space-y-1 mt-1 text-[10px] sm:text-[11px] font-semibold truncate">
                    {cell.totalInc > 0 && (
                      <div className="text-emerald-600 dark:text-emerald-400 truncate">
                        +{format(cell.totalInc)}
                      </div>
                    )}
                    {cell.totalExp > 0 && (
                      <div className="text-slate-700 dark:text-zinc-300 truncate">
                        -{format(cell.totalExp)}
                      </div>
                    )}
                  </div>
                )}

                {!hasActivity && <div className="h-4" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Details Modal with Time & Full Breakdown */}
      <Dialog
        isOpen={Boolean(selectedDayData)}
        onClose={() => setSelectedDayString(null)}
        title={selectedDayData ? formatDate(selectedDayData.dateStr, locale) : ''}
      >
        {selectedDayData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-zinc-800/60 border border-slate-200/50 dark:border-zinc-700/50 text-xs">
              <div>
                <span className="text-slate-500 dark:text-zinc-400">{t('calendar.incomes')}:</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  +{format(selectedDayData.totalInc)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-zinc-400">{t('calendar.expenses')}:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                  -{format(selectedDayData.totalExp)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {t('dashboard.recentTransactions')}
              </h4>

              {selectedDayData.incomes.length === 0 && selectedDayData.expenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t('calendar.noEvents')}
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedDayData.incomes.map((inc) => (
                    <div
                      key={inc.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-zinc-100">
                            {t(`incomes.categories.${inc.category}`, { defaultValue: inc.category })}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                            {inc.source && <span>{inc.source}</span>}
                            {inc.time && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> {inc.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        +{format(inc.amount)}
                      </span>
                    </div>
                  ))}

                  {selectedDayData.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-zinc-100">
                            {t(`expenses.categories.${exp.category}`, { defaultValue: exp.category })}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                            {exp.note && <span>{exp.note}</span>}
                            {exp.time && (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> {exp.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-zinc-100 shrink-0">
                        -{format(exp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-end">
              <Button size="sm" variant="ghost" onClick={() => setSelectedDayString(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
