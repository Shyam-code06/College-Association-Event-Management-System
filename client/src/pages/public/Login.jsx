import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Clock, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState(null);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setApprovalNotice(null);
    try {
      const res = await authApi.login(data);
      const { token, user } = res.data;
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}!`);

      const destination = location.state?.from?.pathname || '/apps';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err?.message || 'Login failed. Please check your credentials.';
      if (
        msg.toLowerCase().includes('approval') ||
        msg.toLowerCase().includes('deactivated') ||
        msg.toLowerCase().includes('pending')
      ) {
        setApprovalNotice({
          email: data.email,
          message: msg,
        });
      }
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendApprovalRequest = async () => {
    if (!approvalNotice?.email) return;
    setIsRequestingApproval(true);
    try {
      const res = await authApi.requestApproval(approvalNotice.email);
      toast.success(res?.message || 'Approval request sent to College Administrator!');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit approval request.');
    } finally {
      setIsRequestingApproval(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-canvas/40">
      <div className="w-full max-w-[420px]">
        {/* Vertical Login Card Container */}
        <Card className="p-8 sm:p-10 bg-surface shadow-card border border-line rounded-2xl flex flex-col">
          {/* Vertical Header & Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-2 group mb-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-surface shadow-xs transition-transform group-hover:scale-105">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-ink">Skyline</span>
            </Link>
            <h2 className="text-2xl font-extrabold tracking-tight text-ink mt-1">
              Sign in to your account
            </h2>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Access your student association apps and dashboard
            </p>
          </div>

          {/* Form Fields Stacked Vertically */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              label="EMAIL ADDRESS"
              required
              error={errors.email?.message}
              labelClassName="text-[11px] font-bold uppercase tracking-wider text-ink"
            >
              <Input
                type="email"
                placeholder="name@skyline.edu"
                className="h-11 px-3.5 text-sm rounded-lg border-line focus:ring-2 focus:ring-primary/20"
                {...register('email')}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="PASSWORD"
              required
              error={errors.password?.message}
              labelClassName="text-[11px] font-bold uppercase tracking-wider text-ink"
            >
              <Input
                type="password"
                placeholder="••••••••"
                className="h-11 px-3.5 text-sm rounded-lg border-line focus:ring-2 focus:ring-primary/20"
                {...register('password')}
                disabled={isLoading}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-11 text-sm font-semibold justify-center mt-3 rounded-lg shadow-sm"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Approval Notice Banner */}
          {approvalNotice && (
            <div className="mt-5 p-3.5 rounded-xl bg-warning/10 border border-warning/30 text-ink space-y-2.5">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-ink">Approval Required</h4>
                  <p className="text-muted mt-0.5 leading-relaxed text-[11px]">
                    {approvalNotice.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-warning/20">
                <span className="text-[10px] text-muted truncate max-w-[150px]">
                  {approvalNotice.email}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={isRequestingApproval}
                  onClick={handleSendApprovalRequest}
                  icon={Send}
                  className="text-[11px] h-7 px-2.5 border-warning/40 hover:bg-warning/10 text-ink"
                >
                  Request Approval
                </Button>
              </div>
            </div>
          )}

          {/* Vertical Card Footer */}
          <div className="mt-8 pt-5 border-t border-line text-center">
            <p className="text-xs text-muted">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
