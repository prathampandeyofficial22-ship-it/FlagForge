import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'emerald' | 'zinc' | 'amber' | 'rose' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'zinc',
  size = 'sm',
  className,
  dot = false,
}: BadgeProps) {
  const variants = {
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    zinc: 'bg-surface-800 text-zinc-400 border-border-dark',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    blue: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    zinc: 'bg-zinc-500',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    blue: 'bg-blue-400',
    purple: 'bg-purple-400',
  };

  const sizes = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded border select-none',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
