import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Forbidden = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface border border-line rounded-lg p-8 shadow-card text-center">
        <div className="h-16 w-16 rounded-pill bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink">403 Forbidden</h1>
        <p className="text-xs sm:text-sm text-muted mt-2 mb-6">
          You do not have administrative permission to view this module. Super Admins are restricted strictly to college management, and student accounts cannot access organizer tools.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/apps')}>
            Back to App Launcher
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forbidden;
