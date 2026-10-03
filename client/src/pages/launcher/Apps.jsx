import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { getNavItemsForRole } from '@/config/nav';
import { AppTile } from '@/components/ui/AppTile';
import { SearchInput } from '@/components/ui/SearchInput';

export const Apps = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const allApps = getNavItemsForRole(user?.role);
  const filteredApps = allApps.filter((app) =>
    app.title.toLowerCase().includes(search.toLowerCase()) ||
    app.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Launcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Apps & Modules
            </h1>
            <span className="px-2 py-0.5 rounded-sm bg-primary-soft text-primary text-xs font-semibold">
              {user?.collegeName || 'Skyline'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Select an application module to begin your workspace
          </p>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Filter apps..."
          className="w-full sm:w-64"
        />
      </div>

      {/* Grid of rounded app tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {filteredApps.map((app) => (
          <AppTile
            key={app.id}
            title={app.title}
            description={app.description}
            icon={app.icon}
            href={app.path}
          />
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No apps match your search &ldquo;{search}&rdquo;.
        </div>
      )}
    </div>
  );
};

export default Apps;
