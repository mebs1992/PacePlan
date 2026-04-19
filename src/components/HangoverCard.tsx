import { motion } from 'framer-motion';
import type { HangoverRisk } from '@/types';
import { formatClockWithDay } from '@/lib/time';

const RISK: Record<
  HangoverRisk,
  { label: string; tone: string; border: string }
> = {
  low: {
    label: 'Mild.',
    tone: 'text-risk-green',
    border: 'border-line',
  },
  moderate: {
    label: 'Moderate.',
    tone: 'text-risk-yellow',
    border: 'border-line',
  },
  high: {
    label: 'Rough.',
    tone: 'text-risk-red',
    border: 'border-line',
  },
  severe: {
    label: 'Brutal.',
    tone: 'text-risk-red',
    border: 'border-line',
  },
};

type Props = {
  risk: HangoverRisk;
  /** accepted for API compatibility; card derives its own editorial label */
  label: string;
  drinksLeft: number | null;
  wakeAtMs: number | undefined;
  now: number;
  bacAtWake: number;
};

export function HangoverCard({
  risk,
  drinksLeft,
  wakeAtMs,
  now,
  bacAtWake,
}: Props) {
  const r = RISK[risk];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[20px] bg-bg-card border ${r.border} shadow-card p-5`}
    >
      <div className="flex items-center justify-between">
        <div className="eyebrow">HANGOVER FORECAST</div>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            risk === 'low'
              ? 'bg-risk-green'
              : risk === 'moderate'
                ? 'bg-risk-yellow'
                : 'bg-risk-red'
          }`}
        />
      </div>

      <div
        className={`font-display text-[30px] leading-[1.02] tracking-[-0.02em] mt-1.5 ${r.tone}`}
      >
        <span className="hb-italic">{r.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="rounded-[14px] border border-line bg-bg-elev px-3.5 py-3">
          <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim">
            DRINKS LEFT
          </div>
          <div className="font-display tabular-nums text-[28px] text-ink leading-none mt-1.5">
            {drinksLeft === null ? '—' : drinksLeft}
          </div>
          <div className="font-mono text-[10px] text-ink-dim mt-1 tracking-tight">
            {wakeAtMs ? 'before hangover · ~1.4 std' : 'set a wake time'}
          </div>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-elev px-3.5 py-3">
          <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim">
            AT WAKE
          </div>
          <div className="font-display tabular-nums text-[28px] text-ink leading-none mt-1.5">
            {wakeAtMs ? (
              <>
                {bacAtWake.toFixed(3)}
                <span className="font-mono text-[11px] text-ink-dim ml-1">%</span>
              </>
            ) : (
              <span className="text-ink-dim">—</span>
            )}
          </div>
          <div className="font-mono text-[10px] text-ink-dim mt-1 tabular-nums tracking-tight">
            {wakeAtMs ? formatClockWithDay(wakeAtMs, now) : 'no wake set'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
