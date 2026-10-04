import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/auth';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleFeaturesClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById('features');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#features');
    }
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById('about');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#about');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-line/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" onClick={handleHomeClick} className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-surface shadow-xs transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-ink tracking-tight leading-tight">
              Odoo
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
              Student Organization
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <button
            type="button"
            onClick={handleHomeClick}
            className={`hover:text-ink transition-colors cursor-pointer ${
              location.pathname === '/' && !location.hash ? 'text-primary font-bold' : ''
            }`}
          >
            Home
          </button>
          <Link
            to="/events"
            className={`hover:text-ink transition-colors ${
              location.pathname === '/events' ? 'text-primary font-bold' : ''
            }`}
          >
            Events
          </Link>
          <button
            type="button"
            onClick={handleFeaturesClick}
            className="hover:text-ink transition-colors cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={handleAboutClick}
            className="hover:text-ink transition-colors cursor-pointer"
          >
            About
          </button>
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
