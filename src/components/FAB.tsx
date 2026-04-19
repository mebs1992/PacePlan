import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  onClick: () => void;
  pulse?: boolean;
  label?: string;
};

export function FAB({ onClick, pulse, label }: Props) {
  return (
    <motion.button
      type="button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label ?? 'Log drink, water, or food'}
      className={cn(
        'fixed left-1/2 -translate-x-1/2 z-30 h-16 w-16 rounded-full bg-accent text-white shadow-fab flex items-center justify-center active:bg-accent/90 transition',
        pulse && 'animate-breathe',
      )}
      style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
    >
      <Plus className="h-8 w-8" strokeWidth={2.5} />
    </motion.button>
  );
}
