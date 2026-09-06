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
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
const pad = (n: number) => String(n).padStart(2, '0');

// Five-minute steps cover what anyone actually picks from a list; an existing odd value
// (an edited record, "Now", a typed time) is spliced in so it stays selectable.
const minuteOptions = (current: string) =>
  current && !MINUTE_STEPS.includes(current)
    ? [...MINUTE_STEPS, current].sort((a, b) => Number(a) - Number(b))
    : MINUTE_STEPS;

type Segment = 'hour' | 'minute';

/**
 * Replaces <input type="time">, whose dropdown is browser chrome: it can't be styled,
 * it doesn't match the DatePicker sitting next to it in every form, and its icon is the
 * browser's own rather than the app's.
 *
 * Deliberately small: two short scroll columns, no readout, no steppers, and a card that
 * is exactly as wide as the field so it can never spill out of the dialog. Everything
 * beyond the two columns (arrow keys, typing digits) is invisible until used.
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
    const [segment, setSegment] = useState<Segment>('hour');

    const activeValue = isControlled ? controlledValue || '' : internalValue;
    const [hourPart, minutePart] = isValidTime(activeValue) ? activeValue.split(':') : ['', ''];

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hourColRef = useRef<HTMLDivElement>(null);
    const minuteColRef = useRef<HTMLDivElement>(null);
    // Digits typed so far into the segment being edited, so "1" then "4" reads as 14.
    const typeBufferRef = useRef<string>('');
    const closeTimerRef = useRef<number>();

    useImperativeHandle(ref, () => triggerRef.current!);

    // Same "is there room below?" check the DatePicker does, so a field near the bottom
    // of a dialog opens upward instead of off-screen.
    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 260 && rect.top > 260);
      }
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
        setSegment('hour');
        typeBufferRef.current = '';
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
    }, [isOpen]);

    useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

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

    const emit = (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.({ target: { value: next, name } });
    };

    const setHour = (h: number) => emit(`${pad((h + 24) % 24)}:${minutePart || '00'}`);
    const setMinute = (m: number) => emit(`${hourPart || '00'}:${pad((m + 60) % 60)}`);

    const selectHour = (h: string) => {
      setHour(Number(h));
      setSegment('minute');
      typeBufferRef.current = '';
    };

    // Picking a minute is the last thing anyone does here, so close on it — the value is
    // complete and keeping the card open just adds a click.
    const selectMinute = (m: string) => {
      setMinute(Number(m));
      typeBufferRef.current = '';
      closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 120);
    };

    const step = (delta: number) => {
      if (segment === 'hour') setHour((Number(hourPart) || 0) + delta);
      else setMinute((Number(minutePart) || 0) + delta);
      typeBufferRef.current = '';
    };

    // Typing "0930" fills the field the way the native control does: two digits per
    // segment, with an early jump when the first digit can't start a two-digit value.
    const typeDigit = (digit: string) => {
      const buffer = typeBufferRef.current + digit;
      if (segment === 'hour') {
        if (buffer.length === 1) {
          setHour(Number(buffer));
          if (Number(buffer) > 2) {
            typeBufferRef.current = '';
            setSegment('minute');
          } else {
            typeBufferRef.current = buffer;
          }
          return;
        }
        const hour = Number(buffer);
        setHour(hour <= 23 ? hour : Number(digit));
        typeBufferRef.current = '';
        setSegment('minute');
        return;
      }
      if (buffer.length === 1) {
        setMinute(Number(buffer));
        typeBufferRef.current = Number(buffer) > 5 ? '' : buffer;
        return;
      }
      setMinute(Number(buffer) % 60);
      typeBufferRef.current = '';
    };

    // Escape closes the popover — and *only* the popover. The Dialog these fields live
    // in also listens for Escape on window, so without stopping the event here one
    // press would dismiss the whole form along with the popover, losing everything
    // typed into it. Registered in the capture phase so it runs before Dialog's
    // bubble-phase listener gets the chance. The same listener carries the keyboard
    // editing, since focus stays on the trigger button while the card is open.
    useEffect(() => {
      if (!isOpen) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
          triggerRef.current?.focus();
          return;
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          step(e.key === 'ArrowUp' ? 1 : -1);
          return;
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setSegment(e.key === 'ArrowLeft' ? 'hour' : 'minute');
          typeBufferRef.current = '';
          return;
        }
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          typeDigit(e.key);
        }
      };
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    });

    const handleNow = () => {
      const now = new Date();
      emit(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
      closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 120);
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
      columnLabel: string,
      which: Segment
    ) => (
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 text-center pb-1">
          {columnLabel}
        </div>
        <div
          ref={colRef}
          role="listbox"
          aria-label={columnLabel}
          onMouseDown={() => setSegment(which)}
          className="h-[152px] overflow-y-auto custom-scrollbar snap-y snap-mandatory space-y-0.5 pr-0.5"
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
                  'h-8 w-full rounded-lg flex items-center justify-center text-xs font-medium tabular-nums snap-start transition-colors duration-150',
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
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
            <span className={cn('truncate font-medium tabular-nums', !activeValue && 'text-slate-400 dark:text-zinc-500 font-normal')}>
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
                // left-0 right-0: the card is exactly the width of the field, so it can
                // never hang outside the dialog the way a fixed width did.
                className={cn(
                  'absolute left-0 right-0 z-[100] min-w-[150px] rounded-2xl p-2 backdrop-blur-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl',
                  openUpward ? 'bottom-full mb-2' : 'top-full mt-1'
                )}
              >
                <div className="flex gap-1.5">
                  {column(HOURS, hourPart, selectHour, hourColRef, t('timePicker.hours'), 'hour')}
                  {column(minuteOptions(minutePart), minutePart, selectMinute, minuteColRef, t('timePicker.minutes'), 'minute')}
                </div>

                <button
                  type="button"
                  onClick={handleNow}
                  className="mt-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  {t('timePicker.now')}
                </button>
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
