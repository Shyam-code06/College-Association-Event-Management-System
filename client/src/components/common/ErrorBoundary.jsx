import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-canvas text-ink">
          <div className="max-w-md w-full bg-surface border border-line rounded-lg p-8 shadow-card text-center">
            <div className="h-14 w-14 rounded-pill bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted mb-6">
              {this.state.error?.message || 'An unexpected application error occurred.'}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="primary" onClick={this.handleReload}>
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
