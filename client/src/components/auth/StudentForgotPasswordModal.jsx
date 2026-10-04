import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Mail, ShieldCheck, Lock, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/api/auth';

export const StudentForgotPasswordModal = ({ isOpen, onClose, defaultEmail = '' }) => {
  const navigate = useNavigate();

  // Steps: 'EMAIL' -> 'OTP' -> 'PASSWORD' -> 'SUCCESS'
  const [step, setStep] = useState('EMAIL');
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset modal state on close/open
  const handleClose = () => {
    if (loading) return;
    setStep('EMAIL');
    setOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    onClose();
  };

  // Step 1: Send OTP to Student Email
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid student email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.requestPasswordResetOtp(trimmedEmail);
      toast.success(res?.message || '6-digit OTP sent to your student email!');
      setStep('OTP');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to send OTP.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyPasswordResetOtp({
        email: email.trim(),
        otp: cleanOtp,
      });
      const token = res.data?.resetToken || res.resetToken;
      setResetToken(token || '');
      toast.success('OTP verified! Please create your new password.');
      setStep('PASSWORD');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid or expired OTP code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password directly without old password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.resetPasswordWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        resetToken,
        newPassword,
        confirmPassword,
      });
      toast.success(res?.message || 'Password changed successfully!');
      setStep('SUCCESS');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to reset password.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="h-4 w-4" />
          </div>
          <span>Student Password Recovery</span>
        </div>
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        {/* Step indicator pills */}
        {step !== 'SUCCESS' && (
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-line text-xs font-semibold">
            <span className={step === 'EMAIL' ? 'text-primary' : 'text-muted'}>
              1. Student Email
            </span>
            <span className="text-muted/40">→</span>
            <span className={step === 'OTP' ? 'text-primary' : 'text-muted'}>
              2. Verify OTP
            </span>
            <span className="text-muted/40">→</span>
            <span className={step === 'PASSWORD' ? 'text-primary' : 'text-muted'}>
              3. New Password
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-xs text-danger flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Student Email */}
        {step === 'EMAIL' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Enter your registered student email address. We will verify your student account and send a 6-digit OTP code to verify your identity.
            </p>

            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-primary flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                <strong>Student-Only Service:</strong> Organizers and College Administrators must use the administrative console.
              </span>
            </div>

            <FormField label="STUDENT INSTITUTIONAL EMAIL" required>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <Input
                  type="email"
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="pl-9 h-10 text-sm"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={ArrowRight}
                isLoading={loading}
                disabled={!email.trim() || loading}
              >
                Send 6-Digit OTP
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter & Verify OTP */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center py-1">
              <span className="text-xs text-muted block">We sent a 6-digit verification code to:</span>
              <span className="text-sm font-bold text-ink block mt-0.5">{email}</span>
            </div>

            <FormField label="ENTER 6-DIGIT OTP CODE" required>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                  if (errorMessage) setErrorMessage('');
                }}
                className="w-full text-center text-2xl font-mono font-bold tracking-[8px] py-2.5 rounded-lg border border-line bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted/40"
                autoFocus
                disabled={loading}
              />
              <span className="text-[11px] text-muted text-center block mt-1">
                OTP is valid for 10 minutes. Check your inbox or spam folder.
              </span>
            </FormField>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="text-muted hover:text-ink font-medium"
                disabled={loading}
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={loading}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Resend Code
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={ArrowRight}
                isLoading={loading}
                disabled={otp.length !== 6 || loading}
              >
                Verify Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Set New Password (Directly Without Old Password) */}
        {step === 'PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-muted leading-relaxed">
              Identity verified! Enter your new password below. You do not need your old password.
            </p>

            <FormField label="NEW PASSWORD" required>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="pl-9 h-10 text-sm"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </FormField>

            <FormField label="CONFIRM NEW PASSWORD" required>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <Input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="pl-9 h-10 text-sm"
                  disabled={loading}
                />
              </div>
            </FormField>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                isLoading={loading}
                disabled={!newPassword || newPassword.length < 6 || !confirmPassword || loading}
              >
                Update Password
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Message */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-4">
            <div className="h-14 w-14 rounded-pill bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">Password Updated Successfully!</h3>
              <p className="text-xs text-muted mt-1 leading-relaxed max-w-xs mx-auto">
                Your student portal password has been changed. You can now sign in with your new password.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={() => {
                  handleClose();
                  navigate('/login');
                }}
              >
                Sign In Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StudentForgotPasswordModal;
