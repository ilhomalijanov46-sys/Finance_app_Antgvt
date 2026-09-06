import React, { useState, useRef, useEffect, useId, forwardRef, useImperativeHandle } from 'react';
import { cn } from '../../utils/cn';
import { Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface TimePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string; // HH:mm
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

/**
 * Replaces <input type="time">, whose dropdown is browser chrome: it can't be styled,
 * it doesn't match the DatePicker sitting next to it in every form, and its icon is the
 * browser's own rather than the app's. Deliberately mirrors DatePicker — same trigger
 * button, same popover card, same clear button, same footer — so the two fields read as
 * one pair.
 */
export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(
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
    const { t } = useTranslation();

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string>(controlledValue || defaultValue || '');
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);

    const activeValue = isControlled ? controlledValue || '' : internalValue;
    const [hourPart, minutePart] = isValidTime(activeValue) ? activeValue.split(':') : ['', ''];

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hourColRef = useRef<HTMLDivElement>(null);
    const minuteColRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => triggerRef.current!);

    // Same "is there room below?" check the DatePicker does, so a field near the bottom
    // of a dialog opens upward instead of off-screen.
    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 300 && rect.top > 300);
      }
    }, [isOpen]);

    // Bring the current selection into view when the popover opens — otherwise a value
    // like 23:45 opens the list scrolled to the top with the selection nowhere in sight.
    useEffect(() => {
      if (!isOpen) return;
      const scrollTimer = window.setTimeout(() => {
        for (const col of [hourColRef.current, minuteColRef.current]) {
          const selected = col?.querySelector('[data-selected="true"]') as HTMLElement | null;
          if (selected && col) col.scrollTop = selected.offsetTop - col.clientHeight / 2 + selected.clientHeight / 2;
        }
      }, 0);
      return () => window.clearTimeout(scrollTimer);
    }, [isOpen, activeValue]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Escape closes the popover — and *only* the popover. The Dialog these fields live
    // in also listens for Escape on window, so without stopping the event here one
    // press would dismiss the whole form along with the popover, losing everything
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

    const emit = (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.({ target: { value: next, name } });
    };

    const selectHour = (h: string) => emit(`${h}:${minutePart || '00'}`);
    const selectMinute = (m: string) => emit(`${hourPart || '00'}:${m}`);

    const handleNow = () => {
      const now = new Date();
      emit(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    };

    const handleClear = () => emit('');

    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    const column = (
      values: string[],
      selected: string,
      onPick: (v: string) => void,
      colRef: React.RefObject<HTMLDivElement>,
      columnLabel: string
    ) => (
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 text-center pb-1.5">
          {columnLabel}
        </div>
        <div
          ref={colRef}
          role="listbox"
          aria-label={columnLabel}
          className="h-44 overflow-y-auto custom-scrollbar space-y-0.5 pr-1"
        >
          {values.map((v) => {
            const isSelected = v === selected;
            return (
              <button
                key={v}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onClick={() => onPick(v)}
                className={cn(
                  'h-8 w-full rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150',
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30'
                    : 'text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
                )}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>
    );

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
            <span className={cn('truncate font-medium', !activeValue && 'text-slate-400 dark:text-zinc-500 font-normal')}>
              {activeValue || placeholder || t('timePicker.placeholder')}
            </span>
            <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
          </button>

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

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: openUpward ? -4 : 4, scale: 1 }}
                exit={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'absolute left-0 z-[100] w-48 rounded-2xl p-3.5 backdrop-blur-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl',
                  openUpward ? 'bottom-full mb-2' : 'top-full mt-1'
                )}
              >
                <div className="flex gap-2">
                  {column(HOURS, hourPart, selectHour, hourColRef, t('timePicker.hours'))}
                  {column(MINUTES, minutePart, selectMinute, minuteColRef, t('timePicker.minutes'))}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleNow}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('timePicker.now')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                  >
                    {t('common.close')}
                  </button>
                </div>
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

TimePicker.displayName = 'TimePicker';
