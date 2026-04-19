import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WaterEntry } from '@/types';

type Props = {
  glasses: number;
  drinks: number;
  behind: boolean;
  water: WaterEntry[];
  now: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

function fmtClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function WaterPanel({
  glasses,
  drinks,
  behind,
  water,
  now,
  onAdd,
  onRemove,
}: Props) {
  const deficit = Math.max(0, drinks - glasses);

  return (
    <div>
      <div className="rounded-[16px] border border-line bg-bg-elev p-4">
        <div className="eyebrow">RULE OF THUMB</div>
        <div className="font-display text-[20px] leading-[1.2] tracking-[-0.01em] text-ink mt-1">
          One water per drink.{' '}
          {drinks === 0 ? (
            <span className="hb-italic text-ink-muted">No drinks logged yet.</span>
          ) : deficit > 0 ? (
            <span className="hb-italic text-risk-yellow">
              You&rsquo;re {deficit} behind.
            </span>
          ) : (
            <span className="hb-italic text-risk-green">You&rsquo;re on pace.</span>
          )}
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onAdd}
        className={cn(
          'mt-3 w-full h-[60px] rounded-full font-display text-[18px] transition-all min-tap',
          'bg-accent text-bg-card hover:brightness-110 active:brightness-95 shadow-fab',
          behind && 'animate-breathe',
        )}
      >
        <span className="hb-italic">+ Log a water</span>
      </motion.button>

      {water.length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <div className="eyebrow">LOGGED · {water.length}</div>
            <div className="font-mono text-[10px] text-ink-dim tracking-tight">
              tap to undo
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {water
                .slice()
                .reverse()
                .map((w) => (
                  <motion.button
                    key={w.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.18 }}
                    onClick={() => onRemove(w.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-bg-elev font-mono text-[11px] text-ink-muted hover:text-ink hover:border-line-2 tabular-nums tracking-tight transition"
                  >
                    <span>{fmtClock(w.at)}</span>
                    <span className="text-ink-dim">
                      · {Math.max(0, Math.round((now - w.at) / 60000))}m
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
