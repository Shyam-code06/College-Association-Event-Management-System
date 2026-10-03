import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-line)',
            boxShadow: 'var(--shadow-card)',
            fontSize: '13px',
            fontFamily: 'var(--font-sans)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#28A745',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#DC3545',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
