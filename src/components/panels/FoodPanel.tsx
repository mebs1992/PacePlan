import { Cookie, UtensilsCrossed, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatRelative } from '@/lib/time';
import type { FoodEntry, FoodSize } from '@/types';

type Props = {
  entries: FoodEntry[];
  now: number;
  onAdd: (size: FoodSize) => void;
  onRemove: (id: string) => void;
};

export function FoodPanel({ entries, now, onAdd, onRemove }: Props) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onAdd('snack')}
          className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl bg-amber-50 border border-amber-200 active:bg-amber-100 min-tap transition"
        >
          <Cookie className="h-8 w-8 text-amber-700" />
          <span className="text-ink font-bold tracking-tight">Snack</span>
          <span className="text-[11px] text-amber-800/70">Chips, nuts, small bite</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onAdd('meal')}
          className="flex flex-col items-center justify-center gap-2 h-28 rounded-2xl bg-emerald-50 border border-emerald-200 active:bg-emerald-100 min-tap transition"
        >
          <UtensilsCrossed className="h-8 w-8 text-emerald-700" />
          <span className="text-ink font-bold tracking-tight">Meal</span>
          <span className="text-[11px] text-emerald-800/70">Burger, pasta, proper food</span>
        </motion.button>
      </div>

      <p className="text-xs text-ink-muted mt-3">
        Food slows alcohol absorption — meals more than snacks.
      </p>

      {entries.length > 0 && (
        <div className="mt-6 border-t border-line pt-4">
          <div className="text-sm font-bold text-ink mb-2">History</div>
          <ul>
            {entries
              .slice()
              .reverse()
              .map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between py-2 border-b border-line last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {f.size === 'meal' ? (
                      <UtensilsCrossed className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Cookie className="h-4 w-4 text-amber-700" />
                    )}
                    <span className="text-sm text-ink capitalize font-semibold">{f.size}</span>
                    <span className="text-xs text-ink-muted tabular-nums">
                      {formatRelative(f.at, now)}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(f.id)}
                    className="text-ink-dim hover:text-risk-red p-2 min-tap transition"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
