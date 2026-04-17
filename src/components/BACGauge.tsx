import type { BacRange } from '@/lib/bac';
import type { RiskLevel } from '@/types';
import { AnimatedNumber } from './AnimatedNumber';
import { motion } from 'framer-motion';

const RISK_GRADIENT: Record<RiskLevel, { from: string; to: string; glow: string; text: string; label: string }> = {
  green: {
    from: '#10b981',
    to: '#22d3ee',
    glow: 'rgba(16, 185, 129, 0.45)',
    text: 'text-risk-green',
    label: 'Pacing well',
  },
  yellow: {
    from: '#f59e0b',
    to: '#f43f5e',
    glow: 'rgba(245, 158, 11, 0.45)',
    text: 'text-risk-yellow',
    label: 'Slow down',
  },
  red: {
    from: '#f43f5e',
    to: '#a78bfa',
    glow: 'rgba(244, 63, 94, 0.5)',
    text: 'text-risk-red',
    label: 'Stop drinking',
  },
};

type Props = {
  range: BacRange;
  risk: RiskLevel;
  capPercent?: number;
};

const SIZE = 240;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function BACGauge({ range, risk, capPercent = 0.10 }: Props) {
  const palette = RISK_GRADIENT[risk];
  const pct = Math.min(1, range.typical / capPercent);
  const dash = CIRC * pct;
  const gradientId = `bac-grad-${risk}`;

  return (
    <div className="relative flex flex-col items-center py-2">
      <div
        className="absolute inset-0 -z-10 mx-auto blur-3xl opacity-60"
        style={{
          width: SIZE,
          height: SIZE,
          background: `radial-gradient(circle, ${palette.glow} 0%, transparent 60%)`,
        }}
      />

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
            stroke="rgba(148, 163, 184, 0.12)"
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
          <div className="text-[10px] uppercase tracking-[0.25em] text-ink-muted mb-1">
            Estimated BAC
          </div>
          <div className="font-display text-[56px] leading-none font-semibold text-ink tabular-nums">
            <AnimatedNumber value={range.typical} decimals={3} suffix="%" />
          </div>
          <div className="text-[11px] text-ink-dim mt-2 tabular-nums tracking-wide">
            {range.low.toFixed(3)}–{range.high.toFixed(3)}%
          </div>
        </div>
      </div>

      <motion.div
        key={risk}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2"
      >
        <span
          className="h-2 w-2 rounded-full animate-breathe"
          style={{ background: palette.from, boxShadow: `0 0 12px ${palette.glow}` }}
        />
        <span className={`text-sm font-medium ${palette.text}`}>{palette.label}</span>
      </motion.div>
    </div>
  );
}
