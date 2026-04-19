import type { CutoffResult } from '@/lib/bac';
import { formatClockWithDay } from '@/lib/time';
import { motion } from 'framer-motion';

type Props = { result: CutoffResult; now: number };

export function CutoffBanner({ result, now }: Props) {
  if (result.kind === 'no-drinks') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[16px] border border-line bg-bg-card px-4 py-3"
      >
        <div className="eyebrow">LEDGER</div>
        <div className="font-display italic text-[15px] text-ink-muted mt-0.5 leading-snug">
          Nothing logged yet.
        </div>
      </motion.div>
    );
  }

  if (result.kind === 'over') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[16px] border border-line bg-bg-card px-4 py-3"
      >
        <div className="eyebrow text-risk-red">STOP DRINKING</div>
        <div className="font-display text-[18px] leading-[1.2] text-ink mt-0.5">
          <span className="hb-italic text-risk-red">Hangover risk is high.</span>
        </div>
        <div className="font-mono text-[11px] text-ink-dim mt-1.5 tabular-nums tracking-tight">
          projected peak · {result.bacAtSessionEnd.toFixed(3)}% by session end
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[16px] border border-line bg-bg-card px-4 py-3"
    >
      <div className="eyebrow text-risk-yellow">LAST CALL</div>
      <div className="font-display text-[18px] leading-[1.2] text-ink mt-0.5">
        Last drink by{' '}
        <span className="hb-italic text-risk-yellow">
          {formatClockWithDay(result.cutoffAt, now)}.
        </span>
      </div>
      <div className="font-mono text-[11px] text-ink-dim mt-1.5 tracking-tight">
        to stay below the hangover threshold
      </div>
    </motion.div>
  );
}
