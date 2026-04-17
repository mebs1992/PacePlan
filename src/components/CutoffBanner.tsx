import type { CutoffResult } from '@/lib/bac';
import { formatClock } from '@/lib/time';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = { result: CutoffResult };

export function CutoffBanner({ result }: Props) {
  if (result.kind === 'no-drinks') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-3 glass flex items-center gap-3"
      >
        <CheckCircle2 className="h-5 w-5 text-ink-muted" />
        <div className="text-sm text-ink-muted">No drinks logged yet.</div>
      </motion.div>
    );
  }

  if (result.kind === 'over') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-3 flex items-start gap-3 bg-gradient-to-br from-risk-red/25 to-[#a78bfa]/10 border border-risk-red/40 shadow-[0_0_30px_-10px_rgba(244,63,94,0.5)]"
      >
        <div className="animate-breathe">
          <AlertTriangle className="h-5 w-5 text-risk-red mt-0.5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-risk-red">
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
      className="rounded-2xl p-3 flex items-start gap-3 bg-gradient-to-br from-risk-yellow/15 to-amber-500/5 border border-risk-yellow/30"
    >
      <Clock className="h-5 w-5 text-risk-yellow mt-0.5" />
      <div>
        <div className="text-sm font-semibold text-risk-yellow">
          Last drink by {formatClock(result.cutoffAt)}
        </div>
        <div className="text-xs text-ink-muted mt-0.5">
          To stay below the hangover threshold by session end.
        </div>
      </div>
    </motion.div>
  );
}
