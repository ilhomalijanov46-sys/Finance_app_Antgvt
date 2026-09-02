import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
  layoutId?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = 'md',
  layoutId,
}) => {
  // The sliding pill is a shared-layout element, so its id must be unique per Tabs
  // instance. A constant default would make two tab strips rendered at the same time
  // share one pill, and it would fly across the screen between them.
  const generatedLayoutId = useId();
  const pillLayoutId = layoutId ?? `activeTabPill-${generatedLayoutId}`;

  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center rounded-xl p-1 bg-slate-200/60 dark:bg-zinc-800/80 backdrop-blur-md border border-slate-300/30 dark:border-zinc-700/50',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 font-medium transition-colors z-10',
              size === 'sm' ? 'px-3 py-1 text-xs rounded-lg' : 'px-4 py-1.5 text-sm rounded-lg',
              isActive
                ? 'text-slate-900 dark:text-zinc-100 font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={pillLayoutId}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-zinc-700 shadow-apple-sm z-[-1]"
              />
            )}
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
