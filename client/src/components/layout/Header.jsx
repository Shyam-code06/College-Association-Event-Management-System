import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-line/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-surface shadow-xs transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-ink tracking-tight leading-tight">
              Skyline
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted">
              Student Association
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <Link to="/" className="hover:text-ink transition-colors">
            Home
          </Link>
          <Link to="/events" className="hover:text-ink transition-colors">
            Events
          </Link>
          <a href="#features" className="hover:text-ink transition-colors">
            Features
          </a>
          <a href="#about" className="hover:text-ink transition-colors">
            About
          </a>
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/apps')}
              icon={ArrowRight}
            >
              Go to Apps ({user?.name?.split(' ')[0]})
            </Button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-ink hover:text-primary transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
