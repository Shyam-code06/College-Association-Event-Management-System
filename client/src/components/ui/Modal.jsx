import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  className,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-lg bg-surface p-6 text-left align-middle shadow-card border border-line transition-all relative',
                  maxWidth,
                  className
                )}
              >
                <div className="flex items-start justify-between pb-3 border-b border-line mb-4">
                  <div>
                    {title && (
                      <Dialog.Title as="h3" className="text-lg font-bold text-ink leading-6">
                        {title}
                      </Dialog.Title>
                    )}
                    {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-muted hover:text-ink rounded-sm hover:bg-canvas transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
