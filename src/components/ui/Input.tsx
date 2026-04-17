import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-12 px-4 rounded-xl bg-white/5 text-ink placeholder:text-ink-dim border border-white/10 focus:border-accent focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-accent/20 transition text-base',
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = 'Input';
