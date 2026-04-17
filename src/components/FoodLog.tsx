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
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.2em]">
          Food
        </h2>
        {last && (
          <div className="text-[11px] text-ink-muted">
            Last {last.size} · {formatRelative(last.at, now)}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onAdd('snack')}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-white/10 min-tap"
        >
          <Cookie className="h-5 w-5 text-amber-400" />
          <span className="text-ink font-medium">Snack</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onAdd('meal')}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-white/10 min-tap"
        >
          <UtensilsCrossed className="h-5 w-5 text-emerald-400" />
          <span className="text-ink font-medium">Meal</span>
        </motion.button>
      </div>
    </Card>
  );
}
