import { motion } from 'framer-motion';
import { Moon, Sunrise } from 'lucide-react';
import type { HangoverRisk } from '@/types';
import { formatClockWithDay } from '@/lib/time';

const PALETTE: Record<
  HangoverRisk,
  { bg: string; ring: string; text: string; accent: string }
> = {
  low: {
    bg: 'bg-emerald-50',
    ring: 'border-emerald-200',
    text: 'text-emerald-800',
    accent: 'text-risk-green',
  },
  moderate: {
    bg: 'bg-amber-50',
    ring: 'border-amber-200',
    text: 'text-amber-900',
    accent: 'text-risk-yellow',
  },
  high: {
    bg: 'bg-rose-50',
    ring: 'border-rose-200',
    text: 'text-rose-900',
    accent: 'text-risk-red',
  },
  severe: {
    bg: 'bg-rose-100',
    ring: 'border-rose-300',
    text: 'text-rose-900',
    accent: 'text-risk-red',
  },
};

type Props = {
  risk: HangoverRisk;
  label: string;
  drinksLeft: number | null;
  wakeAtMs: number | undefined;
  now: number;
  bacAtWake: number;
};

export function HangoverCard({
  risk,
  label,
  drinksLeft,
  wakeAtMs,
  now,
  bacAtWake,
}: Props) {
  const p = PALETTE[risk];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-5 ${p.bg} border ${p.ring}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-ink-muted">Hangover forecast</div>
        <Moon className="h-4 w-4 text-ink-muted" />
      </div>

      <div className={`mt-2 text-2xl font-bold tracking-tight ${p.accent}`}>{label}</div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3 bg-white/70 border border-white">
          <div className="text-[11px] font-medium text-ink-muted">Drinks left</div>
          <div className="text-3xl font-bold text-ink tabular-nums mt-1 tracking-tight">
            {drinksLeft === null ? '—' : drinksLeft}
          </div>
          <div className="text-[11px] text-ink-dim mt-0.5">
            {wakeAtMs ? 'before hangover · ~1.4 std each' : 'set a wake time'}
          </div>
        </div>
        <div className="rounded-2xl p-3 bg-white/70 border border-white">
          <div className="text-[11px] font-medium text-ink-muted flex items-center gap-1">
            <Sunrise className="h-3 w-3" /> At wake
          </div>
          <div className="text-3xl font-bold text-ink tabular-nums mt-1 tracking-tight">
            {wakeAtMs ? (
              <>
                {bacAtWake.toFixed(3)}
                <span className="text-sm text-ink-muted font-semibold">%</span>
              </>
            ) : (
              <span className="text-ink-muted">—</span>
            )}
          </div>
          <div className="text-[11px] text-ink-dim mt-0.5 tabular-nums">
            {wakeAtMs ? formatClockWithDay(wakeAtMs, now) : 'no wake set'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
