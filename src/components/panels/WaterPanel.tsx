import { Droplet, Minus, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { WaterEntry } from '@/types';
import { formatRelative } from '@/lib/time';

type Props = {
  glasses: number;
  drinks: number;
  behind: boolean;
  water: WaterEntry[];
  now: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

export function WaterPanel({
  glasses,
  drinks,
  behind,
  water,
  now,
  onAdd,
  onRemove,
}: Props) {
  const target = Math.max(drinks, 1);
  const pct = Math.min(1, glasses / target);

  return (
    <div>
      <div className="text-center pt-2 pb-4">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-sky-100 flex items-center justify-center mb-3">
          <Droplet className="h-8 w-8 text-sky-600" />
        </div>
        <div className="text-5xl font-bold text-ink tabular-nums tracking-tight">
          {glasses}
          <span className="text-2xl text-ink-muted font-semibold"> / {drinks || 1}</span>
        </div>
        <div
          className={cn(
            'text-sm font-semibold mt-1',
            behind ? 'text-risk-yellow' : 'text-ink-muted',
          )}
        >
          {behind
            ? `${target - glasses} ${target - glasses === 1 ? 'glass' : 'glasses'} behind`
            : drinks === 0
              ? 'Stay ahead of the curve'
              : 'Good pace'}
        </div>

        <div className="relative h-3 rounded-full bg-bg-elev border border-line overflow-hidden my-5">
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              behind ? 'bg-risk-yellow' : 'bg-sky-500',
            )}
            initial={false}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              const last = water[water.length - 1];
              if (last) onRemove(last.id);
            }}
            disabled={glasses === 0}
            className="h-14 w-14 rounded-full bg-bg-elev border border-line text-ink-muted disabled:opacity-40 active:bg-bg-deep transition"
            aria-label="Remove one"
          >
            <Minus className="h-6 w-6 mx-auto" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onAdd}
            className={cn(
              'h-20 w-20 rounded-full flex items-center justify-center text-white shadow-[0_10px_24px_-8px_rgba(14,165,233,0.55),0_2px_6px_rgba(26,21,18,0.08)] bg-sky-500 hover:bg-sky-600 active:bg-sky-700 transition',
              behind && 'animate-breathe',
            )}
            aria-label="Add one glass"
          >
            <Plus className="h-10 w-10" strokeWidth={2.5} />
          </motion.button>
          <div className="h-14 w-14" aria-hidden />
        </div>
      </div>

      {water.length > 0 && (
        <div className="mt-2 border-t border-line pt-4">
          <div className="text-sm font-bold text-ink mb-2">History</div>
          <ul>
            {water
              .slice()
              .reverse()
              .map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between py-2 border-b border-line last:border-0"
                >
                  <span className="text-sm text-ink">Glass of water</span>
                  <span className="text-xs text-ink-muted tabular-nums">
                    {formatRelative(w.at, now)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
