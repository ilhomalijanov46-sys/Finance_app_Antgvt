import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { lockScroll, unlockScroll, forceUnlockScroll } from '../../utils/scrollLock';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      lockScroll();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        unlockScroll();
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      unlockScroll();
    }
  }, [isOpen, onClose]);

  // Safety cleanup on unmount
  useEffect(() => {
    return () => {
      forceUnlockScroll();
    };
  }, []);

  const maxSizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={forceUnlockScroll}>
      {isOpen && (
        <motion.div
          key="dialog-overlay-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={cn(
              'relative w-full z-10 my-8 rounded-3xl',
              'backdrop-blur-2xl bg-white/95 dark:bg-zinc-900/95',
              'border border-slate-200/80 dark:border-zinc-800/85',
              'shadow-2xl text-slate-900 dark:text-zinc-100',
              maxSizes[maxWidth],
              className
            )}
          >
            {(title || description) && (
              <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-zinc-800/60 rounded-t-3xl">
                <div className="space-y-1 min-w-0 pr-4">
                  {title && <h2 className="text-lg font-bold tracking-tight truncate">{title}</h2>}
                  {description && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-5 sm:p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

