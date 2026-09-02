import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  overflow?: 'hidden' | 'visible';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'glass', padding = 'md', overflow = 'visible', children, ...props }, ref) => {
    const variants = {
      glass:
        'backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-apple-sm text-slate-900 dark:text-zinc-100',
      default:
        'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-apple-sm text-slate-900 dark:text-zinc-100',
      solid:
        'bg-slate-100 dark:bg-zinc-800 border-none text-slate-900 dark:text-zinc-100',
      interactive:
        'backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-apple-sm hover:shadow-apple-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer text-slate-900 dark:text-zinc-100',
    };

    const paddings = {
      none: '',
      sm: 'p-3.5',
      md: 'p-5',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          overflow === 'hidden' ? 'overflow-hidden' : 'overflow-visible',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
