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
    'bg-gradient-to-br from-accent to-accent-violet text-bg-solid shadow-[0_8px_24px_-8px_rgba(34,211,238,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(34,211,238,0.8)] active:scale-[0.97]',
  secondary:
    'bg-white/5 text-ink border border-white/10 hover:bg-white/10 active:scale-[0.97] backdrop-blur',
  ghost: 'bg-transparent text-ink hover:bg-white/5 active:scale-[0.97]',
  danger:
    'bg-gradient-to-br from-risk-red to-[#a78bfa] text-white shadow-[0_8px_24px_-8px_rgba(244,63,94,0.6)] active:scale-[0.97]',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-14 px-6 text-base font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'primary', size = 'md', ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl font-medium transition-all duration-150 min-tap select-none disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  )
);
Button.displayName = 'Button';
