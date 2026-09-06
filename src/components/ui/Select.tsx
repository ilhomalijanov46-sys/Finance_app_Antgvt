import React, { useState, useRef, useEffect, forwardRef, useId, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
}

export interface SelectProps {
  label?: string;
  /** For a select with no visible label (e.g. sitting beside another field that
   * already carries one) — announced to assistive tech without adding a line of
   * visible text. */
  ariaLabel?: string;
  error?: string;
  options?: SelectOption[];
  helperText?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  children?: React.ReactNode;
  id?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      label,
      ariaLabel,
      error,
      options,
      helperText,
      value: controlledValue,
      defaultValue,
      onChange,
      name,
      disabled,
      placeholder,
      children,
      id,
    },
    ref
  ) => {
    const { t } = useTranslation();

    // Extract options if passed as children
    const parsedOptions: SelectOption[] = React.useMemo(() => {
      if (options && options.length > 0) return options;

      const opts: SelectOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === 'option') {
          const childProps = child.props as { value: string; children: React.ReactNode };
          opts.push({
            value: String(childProps.value),
            label: childProps.children,
          });
        }
      });
      return opts;
    }, [options, children]);

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string>(
      controlledValue || defaultValue || (parsedOptions[0]?.value ?? '')
    );
    const [isOpen, setIsOpen] = useState(false);
    // Which row the keyboard cursor is on while the popover is open — separate from
    // the actual selected value, same as a native <select>'s roving highlight.
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const activeValue = isControlled ? controlledValue : internalValue;
    // No fallback to parsedOptions[0]: showing the first option's label when the
    // current value doesn't match any of them would silently misrepresent what is
    // actually stored (e.g. a category that was since renamed or deleted) as
    // whatever happens to be first in the list.
    const activeOption = parsedOptions.find((o) => o.value === activeValue);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => triggerRef.current!);

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

    // Handle keyboard escape
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Keep the roving highlight on the actual selection whenever the popover opens.
    useEffect(() => {
      if (isOpen) {
        const idx = parsedOptions.findIndex((o) => o.value === activeValue);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSelect = (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      if (onChange) {
        onChange({ target: { value: val, name } });
      }
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    // Arrow/Home/End/Enter on the closed-or-open trigger — the same keys a native
    // <select> responds to, none of which worked here before.
    const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled || parsedOptions.length === 0) return;

      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(parsedOptions.length - 1, i + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(0, i - 1));
          break;
        case 'Home':
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setHighlightedIndex(parsedOptions.length - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (parsedOptions[highlightedIndex]) handleSelect(parsedOptions[highlightedIndex].value);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    // Same reason as Input: a label-derived id collides whenever two selects share a
    // label, and a Cyrillic label produced a non-ASCII id.
    const generatedId = useId();
    const selectId = id || generatedId;
    const listboxId = `${selectId}-listbox`;
    const errorId = `${selectId}-error`;
    const optionId = (value: string) => `${selectId}-option-${value}`;

    return (
      <div className={cn('w-full space-y-1.5', isOpen ? 'relative z-30' : 'relative z-10')} ref={containerRef}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 ml-0.5 tracking-tight"
          >
            {label}
          </label>
        )}

        <div className={cn('relative', isOpen ? 'z-40' : 'z-0')}>
          {/* Custom Trigger Button */}
          <button
            id={selectId}
            ref={triggerRef}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-activedescendant={isOpen && parsedOptions[highlightedIndex] ? optionId(parsedOptions[highlightedIndex].value) : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            aria-label={!label ? ariaLabel : undefined}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleTriggerKeyDown}
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
            <div className="flex items-center gap-2.5 truncate">
              {activeOption?.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeOption.color }}
                />
              )}
              {activeOption?.icon && (
                <span className="shrink-0 text-slate-500 dark:text-zinc-400">
                  {activeOption.icon}
                </span>
              )}
              <span className="truncate">
                {activeOption ? activeOption.label : placeholder ?? t('common.select')}
              </span>
            </div>

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-slate-400 dark:text-zinc-500 shrink-0 ml-2"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          {/* Custom Animated Dropdown Popover */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                role="listbox"
                id={listboxId}
                aria-label={label || ariaLabel}
                className="absolute left-0 right-0 z-[100] mt-1 max-h-64 overflow-y-auto rounded-2xl p-1.5 backdrop-blur-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
              >
                <div className="space-y-0.5">
                  {parsedOptions.map((opt, index) => {
                    const isSelected = opt.value === activeValue;
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <button
                        key={opt.value}
                        id={optionId(opt.value)}
                        role="option"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left',
                          isSelected
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-zinc-300',
                          isHighlighted && !isSelected && 'bg-slate-100 dark:bg-zinc-800/80'
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {opt.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: opt.color }}
                            />
                          )}
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <span className="truncate">{opt.label}</span>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-xs text-rose-500 dark:text-rose-400 ml-0.5 animate-fade-in font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-zinc-400 ml-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
