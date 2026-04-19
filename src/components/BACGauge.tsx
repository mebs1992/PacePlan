import type { BacRange } from '@/lib/bac';
import type { RiskLevel } from '@/types';
import { AnimatedNumber } from './AnimatedNumber';
import { motion } from 'framer-motion';

const RISK_GRADIENT: Record<RiskLevel, { from: string; to: string; text: string; dot: string; label: string }> = {
  green: {
    from: '#2E9E6B',
    to: '#7AC59A',
    text: 'text-risk-green',
    dot: '#2E9E6B',
    label: 'Pacing well',
  },
  yellow: {
    from: '#F4A261',
    to: '#E8A33A',
    text: 'text-risk-yellow',
    dot: '#E8A33A',
    label: 'Slow down',
  },
  red: {
    from: '#FF5A5F',
    to: '#E5484D',
    text: 'text-risk-red',
    dot: '#E5484D',
    label: 'Stop drinking',
  },
};

type Props = {
  range: BacRange;
  risk: RiskLevel;
  capPercent?: number;
};

const SIZE = 240;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function BACGauge({ range, risk, capPercent = 0.10 }: Props) {
  const palette = RISK_GRADIENT[risk];
  const pct = Math.min(1, range.typical / capPercent);
  const dash = CIRC * pct;
  const gradientId = `bac-grad-${risk}`;

  return (
    <div className="relative flex flex-col items-center py-4 bg-bg-card rounded-3xl border border-line shadow-card">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.from} />
              <stop offset="100%" stopColor={palette.to} />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#EDE3D6"
            strokeWidth={STROKE}
            fill="none"
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC - dash }}
            transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[11px] font-medium text-ink-muted mb-1">
            Estimated BAC
          </div>
          <div className="font-display text-[56px] leading-none font-semibold text-ink tabular-nums tracking-tight">
            <AnimatedNumber value={range.typical} decimals={3} suffix="%" />
          </div>
          <div className="text-[12px] text-ink-dim mt-2 tabular-nums">
            {range.low.toFixed(3)}–{range.high.toFixed(3)}%
          </div>
        </div>
      </div>

      <motion.div
        key={risk}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 mb-1 flex items-center gap-2"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: palette.dot }}
        />
        <span className={`text-sm font-semibold ${palette.text}`}>{palette.label}</span>
      </motion.div>
    </div>
  );
}
