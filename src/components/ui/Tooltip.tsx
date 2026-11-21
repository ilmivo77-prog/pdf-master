import React, {useId, useState} from 'react';
import {cn} from '../../lib/cn';

export interface TooltipProps {
  content: string;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  placement?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      setVisible(false);
    }
    children.props.onKeyDown?.(event);
  };

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {React.cloneElement(children, {
        'aria-describedby': visible ? tooltipId : undefined,
        onKeyDown: handleKeyDown,
      })}

      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute start-1/2 z-40 -translate-x-1/2 rtl:translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md whitespace-nowrap',
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
