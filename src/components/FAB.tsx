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
        'fixed right-5 z-30 h-[60px] w-[60px] rounded-[20px] bg-ink text-white shadow-fab flex items-center justify-center active:bg-ink/90 transition',
      )}
      style={{ bottom: 'calc(5.25rem + env(safe-area-inset-bottom))' }}
    >
      <Plus className="h-[22px] w-[22px]" strokeWidth={2.25} />
      {pulse && (
        <span
          className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-risk-yellow animate-breathe"
          style={{ border: '2px solid #0F172A' }}
        />
      )}
    </motion.button>
  );
}
