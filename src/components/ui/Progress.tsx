import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface ProgressProps {
  value: number; // 0 to 100 (or >100 for overbudget)
  max?: number;
  variant?: 'default' | 'dynamic' | 'success' | 'danger' | 'warning';
  customColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'default',
  customColor,
  size = 'md',
  className,
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const isOver = value > max;

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getDynamicColor = () => {
    if (customColor) return customColor;
    if (variant === 'dynamic') {
      if (percentage >= 100 || isOver) return '#f43f5e'; // Rose
      if (percentage >= 75) return '#f59e0b'; // Amber
      return '#10b981'; // Emerald
    }
    if (variant === 'success') return '#10b981';
    if (variant === 'danger') return '#f43f5e';
    if (variant === 'warning') return '#f59e0b';
    return '#0071e3'; // Apple Blue
  };

  const barColor = getDynamicColor();

  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-zinc-800/80',
        heights[size],
        className
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ backgroundColor: barColor }}
      />
    </div>
  );
};
