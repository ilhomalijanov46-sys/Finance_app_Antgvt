import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

    const activeValue = isControlled ? controlledValue : internalValue;
    const activeOption = parsedOptions.find((o) => o.value === activeValue) || parsedOptions[0];

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
        }
      };
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
      }
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = (val: string) => {
      if (!isControlled) {
        setInternalValue(val);
      }
      if (onChange) {
        onChange({ target: { value: val, name } });
      }
      setIsOpen(false);
    };

    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
            disabled={disabled}
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
                className="absolute left-0 right-0 z-[100] mt-1 max-h-64 overflow-y-auto rounded-2xl p-1.5 backdrop-blur-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
              >
                <div className="space-y-0.5">
                  {parsedOptions.map((opt) => {
                    const isSelected = opt.value === activeValue;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left',
                          isSelected
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/80'
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
          <p className="text-xs text-rose-500 dark:text-rose-400 ml-0.5 animate-fade-in font-medium">
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
