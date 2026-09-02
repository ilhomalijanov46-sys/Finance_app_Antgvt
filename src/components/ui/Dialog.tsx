import React, { useEffect, useId, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Longest possible exit animation (backdrop fade + content spring) plus headroom.
const EXIT_ANIMATION_TIMEOUT = 400;

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
}) => {
  const dialogId = useId();
  // Track whether exit animation is in progress so we keep the portal mounted
  const [showPortal, setShowPortal] = useState(isOpen);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  // Mount the portal in the same commit that opens the dialog. Doing this in an effect
  // instead would delay the dialog by a frame, and effect scheduling is not something to
  // depend on (a backgrounded tab throttles it heavily).
  if (isOpen && !showPortal) {
    setShowPortal(true);
  }

  // Don't unmount immediately when isOpen goes false — let AnimatePresence play the exit
  // animation first. But the teardown is NOT allowed to depend on Framer Motion alone:
  // if anything inside the dialog holds an unfinished layout animation (e.g. a shared
  // `layoutId` tab pill), `onExitComplete` never fires and the portal would stay mounted
  // forever. This timer guarantees it is torn down regardless.
  useEffect(() => {
    if (isOpen) {
      clearExitTimer();
      return;
    }

    clearExitTimer();
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      setShowPortal(false);
    }, EXIT_ANIMATION_TIMEOUT);

    return clearExitTimer;
  }, [isOpen, clearExitTimer]);

  // Never leave a stray timer behind
  useEffect(() => clearExitTimer, [clearExitTimer]);

  // Stable ref for onClose to avoid stale closures
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Called after Framer Motion finishes the exit animation (best case — the timer above
  // is the fallback for when it never fires)
  const handleExitComplete = useCallback(() => {
    clearExitTimer();
    setShowPortal(false);
  }, [clearExitTimer]);

  const maxSizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Don't render any portal at all if nothing to show
  if (!showPortal || typeof document === 'undefined') return null;

  return createPortal(
    // The hit-testing layer is a plain div driven ONLY by `isOpen` — never by an
    // animation. Framer Motion can stall mid-animation (a stuck `layoutId` projection,
    // a backgrounded tab that freezes rAF/WAAPI) and leave the animated element at an
    // arbitrary opacity forever; if that element were the one covering the viewport,
    // the whole page would stop reacting to clicks and scrolling. Here a stalled
    // animation can only ever be a cosmetic glitch.
    <div
      className="fixed inset-0 z-[1000]"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isOpen && (
          <motion.div
            key={`dialog-${dialogId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            {/* Backdrop */}
            <div
              onClick={onClose}
              className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm cursor-pointer"
              aria-hidden="true"
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
                    {title && (
                      <h2 className="text-lg font-bold tracking-tight truncate">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        {description}
                      </p>
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
      </AnimatePresence>
    </div>,
    document.body
  );
};
