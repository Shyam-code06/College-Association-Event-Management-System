import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export const AppTile = ({ title, description, icon: Icon, href, color = 'bg-primary-soft text-primary', count, className }) => {
  return (
    <Link
      to={href}
      className={cn(
        'group flex flex-col items-center justify-center p-5 rounded-lg bg-surface border border-line shadow-soft',
        'hover:shadow-card hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-150',
        'text-center relative select-none cursor-pointer',
        className
      )}
    >
      {count !== undefined && count > 0 && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-bold rounded-pill bg-danger text-surface">
          {count}
        </span>
      )}

      <div
        className={cn(
          'h-14 w-14 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105',
          color
        )}
      >
        {Icon && <Icon className="h-7 w-7" />}
      </div>

      <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
        {title}
      </span>
      {description && <span className="text-[11px] text-muted mt-0.5 line-clamp-1">{description}</span>}
    </Link>
  );
};
