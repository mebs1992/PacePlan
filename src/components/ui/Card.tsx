import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'flat';
};

export function Card({ className, variant = 'default', ...rest }: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 shadow-card',
        variant === 'default' ? 'glass' : 'bg-bg-solid/60 border border-white/5',
        className
      )}
      {...rest}
    />
  );
}
