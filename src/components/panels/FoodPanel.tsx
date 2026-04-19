import { motion, AnimatePresence } from 'framer-motion';
import type { FoodEntry, FoodSize } from '@/types';

type Props = {
  entries: FoodEntry[];
  now: number;
  onAdd: (size: FoodSize) => void;
  onRemove: (id: string) => void;
};

function fmtClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function FoodPanel({ entries, now, onAdd, onRemove }: Props) {
  return (
    <div>
      <div className="rounded-[16px] border border-line bg-bg-elev p-4">
        <div className="eyebrow">FOOD SLOWS ABSORPTION</div>
        <p className="font-display text-[15px] leading-[1.45] text-ink-muted mt-1.5">
          A meal bumps absorption from ~20 to ~75 minutes.{' '}
          <span className="hb-italic text-ink">Snack is in the middle.</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onAdd('snack')}
          className="flex flex-col items-center justify-center gap-1 min-h-[88px] rounded-[16px] border border-line bg-bg-elev hover:bg-bg-card active:bg-bg-card transition min-tap"
        >
          <span className="font-display text-[18px] text-ink leading-none">Snack</span>
          <span className="font-mono text-[10px] text-ink-dim mt-1 tracking-tight">
            ~45 min absorption
          </span>
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onAdd('meal')}
          className="flex flex-col items-center justify-center gap-1 min-h-[88px] rounded-[16px] border border-line bg-bg-elev hover:bg-bg-card active:bg-bg-card transition min-tap"
        >
          <span className="font-display text-[18px] text-ink leading-none">Meal</span>
          <span className="font-mono text-[10px] text-ink-dim mt-1 tracking-tight">
            ~75 min absorption
          </span>
        </motion.button>
      </div>

      {entries.length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <div className="eyebrow">LOGGED · {entries.length}</div>
            <div className="font-mono text-[10px] text-ink-dim tracking-tight">
              tap to undo
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {entries
                .slice()
                .reverse()
                .map((f) => (
                  <motion.button
                    key={f.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => onRemove(f.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-bg-elev font-mono text-[11px] text-ink-muted hover:text-ink hover:border-line-2 tabular-nums tracking-tight transition"
                  >
                    <span className="font-display italic text-ink text-[12px] capitalize">
                      {f.size}
                    </span>
                    <span>· {fmtClock(f.at)}</span>
                    <span className="text-ink-dim">
                      · {Math.max(0, Math.round((now - f.at) / 60000))}m
                    </span>
                    <span className="text-ink-dim">✕</span>
                  </motion.button>
                ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
