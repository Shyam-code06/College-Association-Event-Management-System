import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';
import { ROLES } from '@/utils/constants';

export const ChangePassword = () => {
  const { user } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getRoleLabel = (role) => {
    switch (role) {
      case ROLES.COLLEGE_ADMIN:
        return 'College Administrator';
      case ROLES.ORGANIZER:
        return 'Event Organizer';
      case ROLES.SUPER_ADMIN:
        return 'Super Administrator';
      case ROLES.STUDENT:
        return 'Student Member';
      default:
        return role;
    }
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
      toast.error('New password must be different from your current password.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast.success('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err?.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <PageHeader
        title="Security & Password"
        subtitle="Manage your credentials and protect your administrator or organizer account"
        breadcrumbs={[
          { label: 'Apps', href: '/apps' },
          { label: 'Security & Password', href: '/settings/security' },
        ]}
      />

      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Account Profile Summary Card */}
          <Card className="p-6 bg-surface border border-line rounded-lg h-fit space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary-soft text-primary font-bold text-lg flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-ink truncate">{user?.name}</h3>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-line space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted">Account Role:</span>
                <span className="font-semibold text-ink">{getRoleLabel(user?.role)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Campus College:</span>
                <span className="font-semibold text-ink truncate max-w-[150px]">
                  {user?.collegeName || 'Campus'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-canvas/70 rounded-md border border-line text-[11px] text-muted space-y-1.5">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Security Tip
              </div>
              <p className="leading-relaxed">
                Regularly updating your password prevents unauthorized access to your association and event operations.
              </p>
            </div>
          </Card>

          {/* Change Password Form Card */}
          <div className="md:col-span-2">
            <Card className="p-6 sm:p-8 bg-surface border border-line rounded-lg">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-line">
                <KeyRound className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-ink">Update Password</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <FormField label="Current Password" required>
                  <div className="relative">
                    <Input
                      type={showOld ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="pr-10 h-11"
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
                      className="pr-10 h-11"
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
                  <p className="text-[11px] text-muted mt-1">
                    Must be at least 6 characters long.
                  </p>
                </FormField>

                <FormField label="Confirm New Password" required>
                  <div className="relative">
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10 h-11"
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

                <div className="pt-3 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    icon={KeyRound}
                  >
                    Change Password
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
