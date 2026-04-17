import type { CutoffResult } from '@/lib/bac';
import { formatClock } from '@/lib/time';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = { result: CutoffResult };

export function CutoffBanner({ result }: Props) {
  if (result.kind === 'no-drinks') {
    return (
      <div className="rounded-2xl p-3 bg-bg-card flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-ink-muted" />
        <div className="text-sm text-ink-muted">No drinks logged yet.</div>
      </div>
    );
  }

  if (result.kind === 'over') {
    return (
      <div
        className={cn(
          'rounded-2xl p-3 flex items-start gap-3 bg-risk-red/15 border border-risk-red/30'
        )}
      >
        <AlertTriangle className="h-5 w-5 text-risk-red mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-risk-red">
            Stop drinking — you'll likely be hungover
          </div>
          <div className="text-xs text-ink-muted mt-0.5 tabular-nums">
            Projected peak {result.bacAtSessionEnd.toFixed(3)}% BAC by session end.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-3 flex items-start gap-3 bg-risk-yellow/10 border border-risk-yellow/30">
      <Clock className="h-5 w-5 text-risk-yellow mt-0.5" />
      <div>
        <div className="text-sm font-semibold text-risk-yellow">
          Last drink by {formatClock(result.cutoffAt)}
        </div>
        <div className="text-xs text-ink-muted mt-0.5">
          To stay below the hangover threshold by session end.
        </div>
      </div>
    </div>
  );
}
