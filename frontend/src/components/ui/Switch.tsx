import React from 'react';
import { clsx } from 'clsx';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Switch({ checked, onChange, disabled, label, size = 'sm', onClick }: SwitchProps) {
  const isSm = size === 'sm';

  return (
    <label className={clsx('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          if (onClick) onClick(e);
          if (!disabled) onChange(!checked);
        }}
        className={clsx(
          'relative inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-brand-500 focus:ring-offset-1 focus:ring-offset-surface-950',
          isSm ? 'h-4 w-7' : 'h-5 w-9',
          checked ? 'bg-brand-600' : 'bg-surface-800 border border-border-dark'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
            isSm
              ? `h-3 w-3 mt-0.5 ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`
              : `h-4 w-4 mt-0.5 ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`
          )}
        />
      </button>
      {label && <span className="text-xs text-zinc-300 font-medium">{label}</span>}
    </label>
  );
}
