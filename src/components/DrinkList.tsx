import { Card } from '@/components/ui/Card';
import { formatRelative } from '@/lib/time';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DrinkEntry } from '@/types';

type Props = {
  drinks: DrinkEntry[];
  now: number;
  onRemove: (id: string) => void;
};

export function DrinkList({ drinks, now, onRemove }: Props) {
  if (drinks.length === 0) return null;
  const total = drinks.reduce((s, d) => s + d.standardDrinks, 0);
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-base font-semibold text-ink">Drinks</h2>
        <div className="text-xs text-ink-muted tabular-nums">
          {drinks.length} · {total.toFixed(1)} std
        </div>
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {drinks
            .slice()
            .reverse()
            .map((d) => (
              <motion.li
                key={d.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between py-2.5 border-b border-line last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-ink text-sm font-semibold">{d.label}</span>
                  <span className="text-[11px] text-ink-muted tabular-nums">
                    {d.standardDrinks.toFixed(1)} std · {formatRelative(d.at, now)}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(d.id)}
                  className="text-ink-dim hover:text-risk-red p-2 min-tap transition"
                  aria-label="Remove drink"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.li>
            ))}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
