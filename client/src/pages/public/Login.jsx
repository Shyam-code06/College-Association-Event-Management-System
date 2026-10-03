import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api/auth';
import { DEMO_CREDENTIALS } from '@/utils/constants';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const res = await authApi.login(data);
      const { token, user } = res.data;
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}!`);

      const destination = location.state?.from?.pathname || '/apps';
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (cred) => {
    setValue('email', cred.email, { shouldValidate: true });
    setValue('password', cred.password, { shouldValidate: true });
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-surface shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-ink">Skyline</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          Sign in to your account
        </h2>
        <p className="text-xs text-muted mt-1">
          Access your student association apps and dashboard
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="p-8 bg-surface shadow-card border border-line rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Email address" required error={errors.email?.message}>
              <Input
                type="email"
                placeholder="name@skyline.edu"
                {...register('email')}
                disabled={isLoading}
              />
            </FormField>

            <FormField label="Password" required error={errors.password?.message}>
              <Input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credential Chips */}
          <div className="mt-8 pt-6 border-t border-line">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted mb-3">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              <span>Demo Quick-Fill Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo(DEMO_CREDENTIALS.SUPER_ADMIN)}
                className="text-left p-2 rounded-md border border-line bg-canvas hover:bg-canvas-2 transition-colors text-xs"
              >
                <div className="font-semibold text-ink">Super Admin</div>
                <div className="text-[10px] text-muted truncate">superadmin@skyline.edu</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo(DEMO_CREDENTIALS.COLLEGE_ADMIN)}
                className="text-left p-2 rounded-md border border-line bg-canvas hover:bg-canvas-2 transition-colors text-xs"
              >
                <div className="font-semibold text-ink">College Admin</div>
                <div className="text-[10px] text-muted truncate">collegeadmin@skyline.edu</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo(DEMO_CREDENTIALS.ORGANIZER)}
                className="text-left p-2 rounded-md border border-line bg-canvas hover:bg-canvas-2 transition-colors text-xs"
              >
                <div className="font-semibold text-ink">Organizer</div>
                <div className="text-[10px] text-muted truncate">organizer@skyline.edu</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo(DEMO_CREDENTIALS.STUDENT)}
                className="text-left p-2 rounded-md border border-line bg-canvas hover:bg-canvas-2 transition-colors text-xs"
              >
                <div className="font-semibold text-ink">Student</div>
                <div className="text-[10px] text-muted truncate">aarav@skyline.edu</div>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-muted mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
