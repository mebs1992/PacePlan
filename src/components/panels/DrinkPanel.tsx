import { DrinkPicker } from '@/components/DrinkPicker';
import { motion, AnimatePresence } from 'framer-motion';
import type { DrinkEntry, DrinkType } from '@/types';

type Props = {
  drinks: DrinkEntry[];
  now: number;
  onAdd: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
  onRemove: (id: string) => void;
};

function fmtClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function DrinkPanel({ drinks, now, onAdd, onRemove }: Props) {
  const total = drinks.reduce((s, d) => s + d.standardDrinks, 0);
  return (
    <div>
      <DrinkPicker onAdd={onAdd} />

      {drinks.length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <div className="eyebrow">TONIGHT&rsquo;S LEDGER</div>
            <div className="font-mono text-[10px] text-ink-dim tabular-nums tracking-tight">
              {drinks.length} · {total.toFixed(1)} std
            </div>
          </div>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {drinks
                .slice()
                .reverse()
                .map((d) => (
                  <motion.li
                    key={d.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-[14px] bg-bg-elev border border-line"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] text-ink leading-none truncate">
                        {d.label}
                      </div>
                      <div className="font-mono text-[10px] text-ink-dim mt-1 tabular-nums tracking-tight">
                        {fmtClock(d.at)} · {d.standardDrinks.toFixed(1)} std ·{' '}
                        {Math.max(0, Math.round((now - d.at) / 60000))}m ago
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(d.id)}
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim hover:text-risk-red px-2 py-1.5 min-tap transition"
                    >
                      undo
                    </button>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}
