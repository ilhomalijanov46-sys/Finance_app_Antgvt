import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'custom';
  size?: 'sm' | 'md';
  customColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  customColor,
  children,
  style,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    neutral: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-zinc-700/60',
    custom: '',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] font-medium rounded-md',
    md: 'px-2.5 py-1 text-xs font-medium rounded-lg',
  };

  const customStyles: React.CSSProperties = {
    ...(customColor
      ? {
          backgroundColor: `${customColor}15`,
          color: customColor,
          borderColor: `${customColor}30`,
          borderWidth: 1,
        }
      : {}),
    ...style,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      style={customStyles}
      {...props}
    >
      {children}
    </span>
  );
};
