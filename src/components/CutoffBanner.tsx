import type { CutoffResult } from '@/lib/bac';
import { formatClockWithDay } from '@/lib/time';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = { result: CutoffResult; now: number };

export function CutoffBanner({ result, now }: Props) {
  if (result.kind === 'no-drinks') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-3 surface flex items-center gap-3"
      >
        <CheckCircle2 className="h-5 w-5 text-ink-dim" />
        <div className="text-sm text-ink-muted">No drinks logged yet.</div>
      </motion.div>
    );
  }

  if (result.kind === 'over') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-3 flex items-start gap-3 bg-rose-50 border border-rose-200"
      >
        <div className="animate-breathe">
          <AlertTriangle className="h-5 w-5 text-risk-red mt-0.5" />
        </div>
        <div>
          <div className="text-sm font-bold text-risk-red">
            Stop drinking — hangover risk high
          </div>
          <div className="text-xs text-ink-muted mt-0.5 tabular-nums">
            Projected peak {result.bacAtSessionEnd.toFixed(3)}% BAC by session end.
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-3 flex items-start gap-3 bg-amber-50 border border-amber-200"
    >
      <Clock className="h-5 w-5 text-risk-yellow mt-0.5" />
      <div>
        <div className="text-sm font-bold text-amber-900">
          Last drink by {formatClockWithDay(result.cutoffAt, now)}
        </div>
        <div className="text-xs text-amber-900/70 mt-0.5">
          To stay below the hangover threshold by session end.
        </div>
      </div>
    </motion.div>
  );
}
