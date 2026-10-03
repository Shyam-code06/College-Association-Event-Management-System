import React from 'react';
import { Outlet } from 'react-router-dom';
import { Topbar } from './Topbar';

export const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <Topbar />
      <main className="flex-1 pb-12">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
