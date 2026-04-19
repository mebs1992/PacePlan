import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'flat';
};

export function Card({ className, variant = 'default', ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4',
        variant === 'default'
          ? 'bg-bg-card border border-line shadow-card'
          : 'bg-bg-elev border border-line',
        className
      )}
      {...rest}
    />
  );
}
