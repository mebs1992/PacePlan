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
    'bg-accent text-white shadow-fab hover:bg-accent/90 active:bg-accent/80 active:shadow-press active:scale-[0.98]',
  secondary:
    'bg-bg-card text-ink border border-line hover:bg-bg-elev active:bg-bg-deep active:scale-[0.98]',
  ghost:
    'bg-transparent text-ink hover:bg-ink/5 active:bg-ink/10 active:scale-[0.98]',
  danger:
    'bg-risk-red text-white shadow-[0_10px_24px_-8px_rgba(140,58,42,0.45),0_2px_6px_rgba(26,23,18,0.08)] hover:bg-risk-red/90 active:scale-[0.98]',
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
