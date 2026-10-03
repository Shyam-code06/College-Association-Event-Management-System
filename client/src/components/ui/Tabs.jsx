import React from 'react';
import { Tab } from '@headlessui/react';
import { cn } from '@/utils/cn';

export const Tabs = ({ tabs = [], defaultIndex = 0, onChange, className }) => {
  return (
    <Tab.Group defaultIndex={defaultIndex} onChange={onChange}>
      <Tab.List className={cn('flex border-b border-line gap-4', className)}>
        {tabs.map((tab, idx) => (
          <Tab
            key={tab.label || idx}
            className={({ selected }) =>
              cn(
                'py-2.5 px-3 text-sm font-semibold border-b-2 transition-colors duration-150 outline-none cursor-pointer select-none',
                selected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-ink hover:border-line'
              )
            }
          >
            {tab.label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {tabs.map((tab, idx) => (
          <Tab.Panel key={idx} className="focus:outline-none">
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};
