import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(135deg,#6366F1_0%,#7477FF_100%)] text-white shadow-fab hover:brightness-110 active:brightness-95 active:shadow-press active:scale-[0.98]',
  secondary:
    'bg-bg-elev/55 text-ink border border-line hover:bg-bg-elev active:bg-bg-deep active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink hover:bg-bg-elev/45 active:bg-bg-elev/70 active:scale-[0.98]',
  danger:
    'bg-warm-peach text-bg shadow-[0_10px_24px_-8px_rgba(232,207,197,0.35),0_2px_6px_rgba(0,0,0,0.24)] hover:brightness-105 active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl',
  md: 'h-11 px-4 text-base rounded-xl',
  lg: 'h-14 px-6 text-base font-semibold rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold transition-all duration-150 min-tap select-none disabled:opacity-40 disabled:pointer-events-none tracking-tight',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  )
);
Button.displayName = 'Button';
