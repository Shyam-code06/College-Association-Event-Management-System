import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface border border-line rounded-lg p-8 shadow-card text-center">
        <div className="h-16 w-16 rounded-pill bg-canvas text-muted flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-ink">404 - Page Not Found</h1>
        <p className="text-xs sm:text-sm text-muted mt-2 mb-6">
          The page or resource you are looking for does not exist or has been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
