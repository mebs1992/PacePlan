import type { BacRange } from '@/lib/bac';
import type { RiskLevel } from '@/types';
import { cn } from '@/lib/utils';

const RING_COLOR: Record<RiskLevel, string> = {
  green: 'ring-risk-green/60 text-risk-green',
  yellow: 'ring-risk-yellow/60 text-risk-yellow',
  red: 'ring-risk-red/60 text-risk-red',
};

const LABEL: Record<RiskLevel, string> = {
  green: 'Pacing well',
  yellow: 'Slow down',
  red: 'Stop drinking',
};

type Props = {
  range: BacRange;
  risk: RiskLevel;
};

export function BACGauge({ range, risk }: Props) {
  const typical = range.typical;
  const display = typical < 0.001 ? '0.000' : typical.toFixed(3);
  const low = range.low.toFixed(3);
  const high = range.high.toFixed(3);

  return (
    <div className="flex flex-col items-center py-6">
      <div
        className={cn(
          'flex items-center justify-center rounded-full w-56 h-56 ring-8',
          RING_COLOR[risk]
        )}
      >
        <div className="text-center">
          <div className="text-xs uppercase tracking-widest text-ink-muted mb-1">
            Estimated BAC
          </div>
          <div className="text-5xl font-semibold text-ink tabular-nums">{display}%</div>
          <div className="text-xs text-ink-muted mt-2 tabular-nums">
            range {low}–{high}%
          </div>
        </div>
      </div>
      <div className={cn('mt-4 text-sm font-medium', RING_COLOR[risk])}>{LABEL[risk]}</div>
    </div>
  );
}
