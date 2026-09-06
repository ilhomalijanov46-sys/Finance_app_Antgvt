import React, { useState, useRef, useEffect, useId, forwardRef, useImperativeHandle } from 'react';
import { cn } from '../../utils/cn';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateLocalized, getMonthName, toDateKey } from '../../utils/formatters';
import { LocaleCode } from '../../types';

export interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string; // YYYY-MM-DD
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
}

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      value: controlledValue,
      defaultValue,
      onChange,
      name,
      disabled,
      placeholder,
      id,
    },
    ref
  ) => {
    const { t, i18n } = useTranslation();
    const locale = (i18n.language as LocaleCode) || 'ru';

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
      controlledValue || defaultValue || ''
    );
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);

    const activeValue = isControlled ? controlledValue || '' : internalValue;

    // Current viewing month/year in the calendar
    const [viewDate, setViewDate] = useState<Date>(() => {
      if (activeValue) {
        const d = new Date(activeValue + 'T00:00:00');
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => triggerRef.current!);

    // When popover opens, check if it should open upwards or downwards
    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < 330 && rect.top > 330) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }, [isOpen]);

    // When activeValue changes, synchronize viewDate
    useEffect(() => {
      if (activeValue) {
        const d = new Date(activeValue + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          setViewDate(d);
        }
      }
    }, [activeValue]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Escape closes the popover — and *only* the popover. The Dialog these fields live
    // in also listens for Escape on window, so without stopping the event here one
    // press would dismiss the whole form along with the calendar, losing everything
    // typed into it. Registered in the capture phase so it runs before Dialog's
    // bubble-phase listener gets the chance.
    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen]);

    const handleSelectDate = (dateStr: string) => {
      if (!isControlled) {
        setInternalValue(dateStr);
      }
      if (onChange) {
        onChange({ target: { value: dateStr, name } });
      }
      setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) {
        setInternalValue('');
      }
      if (onChange) {
        onChange({ target: { value: '', name } });
      }
    };

    const handleToday = () => {
      const todayStr = toDateKey();
      handleSelectDate(todayStr);
    };

    const prevMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // Calculate days grid - ALWAYS 42 cells (6 full rows)
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7; // Mon is 0

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const calendarGrid = React.useMemo(() => {
      const grid = [];

      // Preceding days
      for (let i = startOffset - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const prevM = month === 0 ? 11 : month - 1;
        const prevY = month === 0 ? year - 1 : year;
        const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        grid.push({ dayNumber: d, dateStr, isCurrentMonth: false });
      }

      // Current month days
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        grid.push({ dayNumber: d, dateStr, isCurrentMonth: true });
      }

      // Trailing days to always fill exactly 42 cells (6 rows)
      const totalCells = 42;
      const remaining = totalCells - grid.length;
      for (let d = 1; d <= remaining; d++) {
        const nextM = month === 11 ? 0 : month + 1;
        const nextY = month === 11 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        grid.push({ dayNumber: d, dateStr, isCurrentMonth: false });
      }

      return grid;
    }, [year, month, startOffset, daysInMonth, prevMonthDays]);

    const weekDayLabels = t('calendar.weekDays', { returnObjects: true }) as string[];

    const todayStr = toDateKey();
    const formattedDisplay = activeValue ? formatDate(activeValue, locale) : '';

    const monthsList = React.useMemo(() => {
      const list = [];
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        list.push({
          index: m,
          name: getMonthName(d, locale, 'short'),
        });
      }
      return list;
    }, [year, locale]);

    const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

    // The activeValue-sync effect above only fires when the *value* itself changes —
    // browsing to a different month and then closing without picking a date left the
    // popover reopening on that stale month instead of the one relevant to what's
    // actually selected. Reset whenever the popover opens instead.
    useEffect(() => {
      if (!isOpen) return;
      if (activeValue) {
        const d = new Date(activeValue + 'T00:00:00');
        if (!isNaN(d.getTime())) setViewDate(d);
      } else {
        setViewDate(new Date());
      }
      setViewMode('days');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const prevYear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(year - 1, month, 1));
    };

    const nextYear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setViewDate(new Date(year + 1, month, 1));
    };

    const selectMonth = (mIdx: number) => {
      setViewDate(new Date(year, mIdx, 1));
      setViewMode('days');
    };

    const selectYear = (y: number) => {
      setViewDate(new Date(y, month, 1));
      setViewMode('months');
    };

    const monthTitle = formatDateLocalized(viewDate, locale, { month: 'long', year: 'numeric' });

    // A label-derived id collides whenever two pickers share a label, and a Cyrillic
    // label produced a non-ASCII id — same fix as Input/Select.
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    // Year range (current year - 8 to + 7), widened to always include the year
    // currently being viewed — otherwise stepping past either edge with the «/»
    // year-jump buttons left the picker's own "select a year" grid unable to show
    // (or highlight) the year it was actually sitting on.
    const yearsRange = React.useMemo(() => {
      const currentY = new Date().getFullYear();
      const start = Math.min(currentY - 8, year);
      const end = Math.max(currentY + 7, year);
      const yrs = [];
      for (let y = start; y <= end; y++) {
        yrs.push(y);
      }
      return yrs;
    }, [year]);

    return (
      <div className={cn('w-full space-y-1.5', isOpen ? 'relative z-30' : 'relative z-10')} ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 ml-0.5 tracking-tight"
          >
            {label}
          </label>
        )}

        <div className={cn('relative', isOpen ? 'z-40' : 'z-0')}>
          {/* Custom Trigger Button */}
          <button
            id={inputId}
            ref={triggerRef}
            type="button"
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              'w-full flex items-center justify-between text-sm rounded-xl px-3.5 py-2.5 text-left outline-none transition-colors duration-150',
              'bg-slate-100/70 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800/80',
              'focus:bg-white dark:focus:bg-zinc-900 text-slate-900 dark:text-zinc-100',
              'border border-slate-200/80 dark:border-zinc-700/60 shadow-apple-sm',
              isOpen && 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-zinc-900',
              disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-rose-500 ring-rose-500/20 text-rose-900 dark:text-rose-100',
              className
            )}
          >
            <span className={cn('truncate font-medium', !formattedDisplay && 'text-slate-400 dark:text-zinc-500 font-normal')}>
              {formattedDisplay || placeholder || t('datePicker.placeholder')}
            </span>
            <CalendarIcon className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
          </button>

          {/* A real, separate <button> rather than a focusable span nested inside the
              trigger <button> — a focusable element nested inside another interactive
              control is not reliably exposed by assistive tech, whatever the visual
              result looks like. Positioned to sit where the nested version used to. */}
          {activeValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title={t('common.clear')}
              aria-label={t('common.clear')}
              className="absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Custom Animated Calendar Popover */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: openUpward ? -4 : 4, scale: 1 }}
                exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'absolute left-0 z-[100] w-80 rounded-2xl p-3.5 backdrop-blur-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl',
                  openUpward ? 'bottom-full mb-2' : 'top-full mt-1'
                )}
              >
                {/* Header with Month / Year and Fast Navigation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'days' ? 'months' : 'days')}
                    className="flex items-center gap-1.5 px-2 py-1 -ml-1 text-xs font-bold text-slate-900 dark:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors capitalize"
                  >
                    <span>{monthTitle}</span>
                    <span className="text-[10px] text-blue-500 font-semibold">
                      {viewMode === 'days' ? '▼' : '▲'}
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title={t('datePicker.prevYear')}
                      onClick={prevYear}
                      className="px-1.5 py-1 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      title={t('datePicker.prevMonth')}
                      onClick={prevMonth}
                      className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title={t('datePicker.nextMonth')}
                      onClick={nextMonth}
                      className="p-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title={t('datePicker.nextYear')}
                      onClick={nextYear}
                      className="px-1.5 py-1 text-[11px] font-bold rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      »
                    </button>
                  </div>
                </div>

                {/* View Modes */}
                {viewMode === 'months' && (
                  <div className="py-2">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                        {t('datePicker.selectMonth')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewMode('years')}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t('calendar.yearLabel', { year })} ➔
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {monthsList.map((m) => (
                        <button
                          key={m.index}
                          type="button"
                          onClick={() => selectMonth(m.index)}
                          className={cn(
                            'py-2 px-2 text-xs font-medium rounded-xl capitalize transition-all',
                            m.index === month
                              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                              : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          )}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === 'years' && (
                  <div className="py-2">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                        {t('datePicker.selectYear')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewMode('months')}
                        className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200"
                      >
                        {t('datePicker.back')}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
                      {yearsRange.map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => selectYear(y)}
                          className={cn(
                            'py-2 px-1 text-xs font-medium rounded-xl transition-all',
                            y === year
                              ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                              : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                          )}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {viewMode === 'days' && (
                  <>
                    {/* Week Day Labels */}
                    <div className="grid grid-cols-7 text-center pt-2.5 pb-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500">
                      {weekDayLabels.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    {/* Fixed 42 Days Grid (6 Rows) */}
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {calendarGrid.map((item, idx) => {
                        const isSelected = item.dateStr === activeValue;
                        const isToday = item.dateStr === todayStr;

                        return (
                          <button
                            key={`${item.dateStr}-${idx}`}
                            type="button"
                            onClick={() => handleSelectDate(item.dateStr)}
                            className={cn(
                              'h-8 w-full rounded-lg flex items-center justify-center font-medium transition-all duration-150 relative',
                              isSelected
                                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                                : item.isCurrentMonth
                                ? 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                                : 'text-slate-300 dark:text-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-800/40',
                              isToday && !isSelected && 'border border-blue-500/60 font-bold text-blue-600 dark:text-blue-400'
                            )}
                          >
                            {item.dayNumber}
                            {isToday && !isSelected && (
                              <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer with Today jump button */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleToday}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t('calendar.today')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                      >
                        {t('common.close')}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error ? (
          <p id={messageId} role="alert" className="text-xs text-rose-500 dark:text-rose-400 ml-0.5 animate-fade-in font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="text-xs text-slate-500 dark:text-zinc-400 ml-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
