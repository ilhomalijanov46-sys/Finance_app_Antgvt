import React from 'react';
import { Card } from '../ui/Card';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  suffix?: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  highlightColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  isCurrency = true,
  suffix,
  subtitle,
  icon,
  trend,
  highlightColor,
  className,
}) => {
  return (
    <Card
      variant="glass"
      padding="md"
      className={cn('relative flex flex-col justify-between overflow-hidden', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-tight uppercase">
          {title}
        </span>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={
            highlightColor
              ? {
                  backgroundColor: `${highlightColor}15`,
                  color: highlightColor,
                  borderColor: `${highlightColor}30`,
                  borderWidth: 1,
                }
              : undefined
          }
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
          <AnimatedCounter
            value={value}
            isCurrency={isCurrency}
            suffix={suffix}
          />
        </div>

        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              // The arrow follows the direction the number actually moved; the colour
              // follows whether that movement is good news, which is the opposite for
              // spending. Reading the sign off `value` keeps a rise in expenses from
              // being displayed as "-3.2%".
              <span
                className={cn(
                  'inline-flex items-center font-semibold rounded-md px-1.5 py-0.5 text-[11px] shrink-0',
                  trend.isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                )}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {trend.value > 0 ? '+' : ''}
                {trend.value}%
              </span>
            )}
            {(trend?.label || subtitle) && (
              <span className="text-slate-500 dark:text-zinc-400 truncate">
                {trend?.label || subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
