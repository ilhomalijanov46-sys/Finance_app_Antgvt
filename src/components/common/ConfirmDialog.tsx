import React from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
      <div className="flex items-center justify-end gap-3 mt-4">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          {cancelLabel || t('common.cancel')}
        </Button>
        <Button
          variant={isDestructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel || (isDestructive ? t('common.delete') : t('common.confirm'))}
        </Button>
      </div>
    </Dialog>
  );
};
