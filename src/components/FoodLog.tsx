import { Card } from '@/components/ui/Card';
import { Cookie, UtensilsCrossed } from 'lucide-react';
import { formatRelative } from '@/lib/time';
import { motion } from 'framer-motion';
import type { FoodEntry } from '@/types';

type Props = {
  entries: FoodEntry[];
  now: number;
  onAdd: (size: 'snack' | 'meal') => void;
};

export function FoodLog({ entries, now, onAdd }: Props) {
  const last = entries[entries.length - 1];
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-ink">Food</h2>
        {last && (
          <div className="text-[11px] text-ink-muted">
            Last {last.size} · {formatRelative(last.at, now)}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => onAdd('snack')}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-bg-elev border border-line hover:bg-white active:bg-bg-deep min-tap transition"
        >
          <Cookie className="h-5 w-5 text-amber-600" />
          <span className="text-ink font-semibold text-sm">Snack</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => onAdd('meal')}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-bg-elev border border-line hover:bg-white active:bg-bg-deep min-tap transition"
        >
          <UtensilsCrossed className="h-5 w-5 text-emerald-700" />
          <span className="text-ink font-semibold text-sm">Meal</span>
        </motion.button>
      </div>
    </Card>
  );
}
