import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full px-3 py-1.5 bg-surface-900 border rounded text-sm text-zinc-100 placeholder-zinc-500 transition-colors',
              'border-border-dark focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
