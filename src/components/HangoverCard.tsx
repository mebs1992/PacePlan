import { motion } from 'framer-motion';
import { Moon, Sunrise } from 'lucide-react';
import type { HangoverRisk } from '@/types';
import { formatClockWithDay } from '@/lib/time';

const PALETTE: Record<
  HangoverRisk,
  { from: string; to: string; glow: string; text: string }
> = {
  low: {
    from: 'from-emerald-400/25',
    to: 'to-cyan-400/10',
    glow: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]',
    text: 'text-risk-green',
  },
  moderate: {
    from: 'from-amber-400/25',
    to: 'to-rose-500/10',
    glow: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]',
    text: 'text-risk-yellow',
  },
  high: {
    from: 'from-rose-500/30',
    to: 'to-[#a78bfa]/10',
    glow: 'shadow-[0_0_40px_-10px_rgba(244,63,94,0.55)]',
    text: 'text-risk-red',
  },
  severe: {
    from: 'from-risk-red/35',
    to: 'to-[#a78bfa]/15',
    glow: 'shadow-[0_0_50px_-10px_rgba(244,63,94,0.7)]',
    text: 'text-risk-red',
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
      className={`relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${p.from} ${p.to} border border-white/10 ${p.glow}`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted">
          Hangover forecast
        </div>
        <Moon className="h-4 w-4 text-ink-muted" />
      </div>

      <div className={`mt-3 text-2xl font-bold ${p.text}`}>{label}</div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-black/20 border border-white/5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            Drinks left
          </div>
          <div className="text-3xl font-bold text-ink tabular-nums mt-1">
            {drinksLeft === null ? '—' : drinksLeft}
          </div>
          <div className="text-[11px] text-ink-dim mt-0.5">
            {wakeAtMs ? 'before hangover at wake' : 'set a wake time'}
          </div>
        </div>
        <div className="rounded-xl p-3 bg-black/20 border border-white/5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted flex items-center gap-1">
            <Sunrise className="h-3 w-3" /> At wake
          </div>
          <div className="text-3xl font-bold text-ink tabular-nums mt-1">
            {wakeAtMs ? (
              <>
                {bacAtWake.toFixed(3)}
                <span className="text-sm text-ink-muted">%</span>
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
