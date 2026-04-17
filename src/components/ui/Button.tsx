import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-bg hover:bg-accent/90 active:bg-accent/80',
  secondary: 'bg-bg-elev text-ink hover:bg-bg-elev/80 active:bg-bg-elev/70',
  ghost: 'bg-transparent text-ink hover:bg-bg-elev/40',
  danger: 'bg-risk-red text-white hover:bg-risk-red/90 active:bg-risk-red/80',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-6 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-colors min-tap select-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  )
);
Button.displayName = 'Button';
