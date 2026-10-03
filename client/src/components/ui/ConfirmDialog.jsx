import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to perform this action? This cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-pill bg-danger/10 text-danger flex items-center justify-center shrink-0">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h4 className="text-base font-bold text-ink">{title}</h4>
        <p className="text-sm text-muted">{message}</p>

        <div className="flex items-center gap-3 w-full mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            fullWidth
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
