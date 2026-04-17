import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Props = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-12 px-4 rounded-xl bg-bg-elev text-ink placeholder:text-ink-dim border border-transparent focus:border-accent focus:outline-none text-base',
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = 'Input';
