import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-bg-card rounded-2xl p-4 shadow-sm', className)}
      {...rest}
    />
  );
}
