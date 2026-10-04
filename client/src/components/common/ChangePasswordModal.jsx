import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOld(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (oldPassword === newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast.success('Password updated successfully!');
      handleClose();
    } catch (err) {
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      subtitle="Update your account login credentials"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Current Password" required>
          <div className="relative">
            <Input
              type={showOld ? 'text' : 'password'}
              placeholder="Enter current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="New Password" required>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm New Password" required>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-type new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-10"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors cursor-pointer"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        <div className="p-3 bg-canvas/80 rounded-md border border-line text-[11px] text-muted space-y-1">
          <p className="font-semibold text-ink flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" /> Password Guidelines:
          </p>
          <p className="leading-relaxed">
            • Minimum 6 characters required.<br />
            • Use a combination of letters, numbers, and special symbols for better security.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-line">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            icon={KeyRound}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
