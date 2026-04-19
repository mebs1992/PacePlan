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
        <h2 className="text-base font-semibold text-ink">Water</h2>
        <div className="text-xs text-ink-muted tabular-nums">
          {glasses} / {drinks}
        </div>
      </div>

      <div className="relative h-2.5 rounded-full bg-bg-elev border border-line overflow-hidden mb-3">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            behind ? 'bg-risk-yellow' : 'bg-sky-500'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-ink-muted">
          {behind ? (
            <span className="text-risk-yellow font-semibold">You're behind — drink water.</span>
          ) : drinks === 0 ? (
            'Tap to log a glass anytime.'
          ) : (
            'Pace looks good.'
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onAdd}
          className={cn(
            'flex items-center gap-1.5 px-4 h-10 rounded-xl font-semibold text-sm min-tap transition',
            'bg-sky-500 text-white shadow-[0_6px_16px_-8px_rgba(14,165,233,0.6)] hover:bg-sky-600 active:bg-sky-700',
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
