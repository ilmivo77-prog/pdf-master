import React, {useId, useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {cn} from '../../lib/cn';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultOpenIds = [],
  className,
}: AccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggleItem = (id: string) => {
    setOpenIds((prev) => {
      const isOpen = prev.includes(id);
      if (isOpen) {
        return prev.filter((item) => item !== id);
      }
      return allowMultiple ? [...prev, id] : [id];
    });
  };

  return (
    <div
      className={cn(
        'divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white',
        className
      )}
    >
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const buttonId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className="flex min-h-[48px] w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm sm:text-base font-semibold text-slate-900 transition-colors duration-150 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700"
              >
                <span>{item.title}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4 shrink-0 text-slate-500 transition-transform duration-150',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-4 text-sm leading-relaxed text-slate-600"
            >
              {isOpen && item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
