import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  LayoutGrid,
  LogOut,
  User,
  Shield,
  Sparkles,
  ChevronDown,
  KeyRound,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { ROLES } from '@/utils/constants';
import { ChangePasswordModal } from '@/components/common/ChangePasswordModal';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'Super Admin';
      case ROLES.COLLEGE_ADMIN:
        return 'College Admin';
      case ROLES.ORGANIZER:
        return 'Organizer';
      case ROLES.STUDENT:
        return 'Student';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-primary text-surface shadow-soft">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: App Launcher button & Brand / Context */}
        <div className="flex items-center gap-4">
          <Link
            to="/apps"
            title="App Launcher"
            className="h-9 w-9 rounded-md bg-primary-dark/60 hover:bg-primary-dark flex items-center justify-center text-surface transition-colors cursor-pointer"
          >
            <LayoutGrid className="h-5 w-5" />
          </Link>

          <Link to="/apps" className="flex items-center gap-2 text-surface hover:opacity-90 transition-opacity">
            <Sparkles className="h-4 w-4" />
            <span className="font-bold tracking-tight text-sm hidden sm:inline">
              Odoo Student Organization
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-primary-soft/20 hidden sm:block" />

          <span className="text-xs font-medium text-primary-soft/90 truncate max-w-[200px] sm:max-w-xs">
            {user?.collegeName || 'Student Association'}
          </span>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="flex items-center gap-2 p-1.5 rounded-md hover:bg-primary-dark/50 transition-colors focus:outline-none">
              <div className="h-8 w-8 rounded-pill bg-primary-soft text-primary font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight text-surface">
                  {user?.name}
                </span>
                <span className="text-[10px] text-primary-soft/80 capitalize">
                  {getRoleBadge(user?.role)}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-primary-soft/80" />
            </Menu.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-surface text-ink shadow-card border border-line divide-y divide-line focus:outline-none z-50">
                <div className="p-3">
                  <p className="text-xs font-medium text-muted">Signed in as</p>
                  <p className="text-sm font-bold text-ink truncate mt-0.5">{user?.name}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-primary-soft text-primary text-[10px] font-semibold">
                    <Shield className="h-3 w-3" />
                    {getRoleBadge(user?.role)}
                  </div>
                </div>

                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/apps')}
                        className={`${
                          active ? 'bg-canvas text-primary' : 'text-ink'
                        } group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium`}
                      >
                        <LayoutGrid className="h-4 w-4 text-muted group-hover:text-primary" />
                        App Launcher
                      </button>
                    )}
                  </Menu.Item>

                  {user?.role === ROLES.STUDENT && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/student/membership')}
                          className={`${
                            active ? 'bg-canvas text-primary' : 'text-ink'
                          } group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium`}
                        >
                          <User className="h-4 w-4 text-muted group-hover:text-primary" />
                          My Membership
                        </button>
                      )}
                    </Menu.Item>
                  )}

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setIsChangePasswordOpen(true)}
                        className={`${
                          active ? 'bg-canvas text-primary' : 'text-ink'
                        } group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium cursor-pointer`}
                      >
                        <KeyRound className="h-4 w-4 text-muted group-hover:text-primary" />
                        Change Password
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? 'bg-danger/10 text-danger' : 'text-danger'
                        } group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium`}
                      >
                        <LogOut className="h-4 w-4 text-danger" />
                        Sign Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
};

export default Topbar;
