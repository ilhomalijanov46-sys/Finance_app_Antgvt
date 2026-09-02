import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <Card
      variant="glass"
      padding="lg"
      className={`text-center flex flex-col items-center justify-center py-12 px-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20 shadow-apple-sm">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mt-1.5 mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="md" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};
