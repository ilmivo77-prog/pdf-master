import React, {forwardRef} from 'react';
import {cn} from '../../lib/cn';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({required = false, className, children, ...props}, ref) => (
    <label
      ref={ref}
      className={cn('block text-sm font-medium text-slate-900', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ms-1 text-red-700" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);

Label.displayName = 'Label';

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({className, children, ...props}, ref) => {
    if (!children) {
      return null;
    }

    return (
      <p
        ref={ref}
        role="alert"
        className={cn('mt-1.5 text-xs font-medium text-red-700', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

FieldError.displayName = 'FieldError';

export interface HelpTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const HelpText = forwardRef<HTMLParagraphElement, HelpTextProps>(
  ({className, children, ...props}, ref) => {
    if (!children) {
      return null;
    }

    return (
      <p
        ref={ref}
        className={cn('mt-1.5 text-xs text-slate-500', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

HelpText.displayName = 'HelpText';
