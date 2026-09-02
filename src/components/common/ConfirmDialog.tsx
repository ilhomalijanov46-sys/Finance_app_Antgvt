import React, { useEffect, useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { formatDbError } from '../../utils/dbErrors';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // A stale error from a previous attempt must not greet the next one
  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  // onConfirm reaches the database, so it can reject. Reporting the failure here
  // covers every call site at once — otherwise the dialog just sits open with no
  // hint that the record was never deleted.
  const handleConfirm = async () => {
    setError(null);
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('Confirm action failed:', err);
      setError(formatDbError(err, 'common.actionFailed'));
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      title={
        <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100">
          {isDestructive && <AlertTriangle className="w-5 h-5 text-rose-500" />}
          <span>{title || t('common.confirmDelete')}</span>
        </div>
      }
      description={description || t('common.actionIrreversible')}
    >
      {error && (
        <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-4">
        <Button variant="ghost" onClick={onClose} disabled={isLoading || isConfirming}>
          {cancelLabel || t('common.cancel')}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          onClick={handleConfirm}
          isLoading={isLoading || isConfirming}
        >
          {confirmLabel || (isDestructive ? t('common.delete') : t('common.confirm'))}
        </Button>
      </div>
    </Dialog>
  );
};
