import { Card } from '@/components/ui/Card';
import { Droplet } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Props = {
  glasses: number;
  drinks: number;
  behind: boolean;
  onAdd: () => void;
};

export function WaterTracker({ glasses, drinks, behind, onAdd }: Props) {
  const target = Math.max(drinks, 1);
  const pct = Math.min(1, glasses / target);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.2em]">
          Water
        </h2>
        <div className="text-xs text-ink-muted tabular-nums">
          {glasses} / {drinks}
        </div>
      </div>

      <div className="relative h-3 rounded-full bg-white/5 overflow-hidden mb-3">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            behind
              ? 'bg-gradient-to-r from-risk-yellow to-risk-red'
              : 'bg-gradient-to-r from-cyan-400 to-blue-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-ink-muted">
          {behind ? (
            <span className="text-risk-yellow">You're behind — drink water.</span>
          ) : drinks === 0 ? (
            'Tap to log a glass anytime.'
          ) : (
            'Pace looks good.'
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onAdd}
          className={cn(
            'flex items-center gap-1.5 px-4 h-10 rounded-xl font-semibold text-sm min-tap',
            'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-[0_6px_20px_-6px_rgba(34,211,238,0.6)]',
            behind && 'animate-breathe'
          )}
        >
          <Droplet className="h-4 w-4" />
          +1
        </motion.button>
      </div>
    </Card>
  );
}
