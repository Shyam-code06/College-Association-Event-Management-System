import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export const Breadcrumbs = ({ items = [], className }) => {
  return (
    <nav className={cn('flex items-center gap-1.5 text-xs text-muted select-none', className)}>
      <Link to="/apps" className="hover:text-primary transition-colors flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={item.label || idx}>
            <ChevronRight className="h-3.5 w-3.5 text-muted/50" />
            {item.href && !isLast ? (
              <Link to={item.href} className="hover:text-primary transition-colors font-medium">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-semibold text-ink' : 'text-muted')}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
