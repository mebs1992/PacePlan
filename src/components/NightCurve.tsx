import { useMemo } from 'react';
import type { BacSample, BacRange } from '@/lib/bac';
import type { RiskLevel } from '@/types';

type Props = {
  range: BacRange;
  risk: RiskLevel;
  curve: BacSample[];
  now: number;
  sessionStart: number;
  sessionEnd: number;
  wakeAt?: number;
  peak: number;
};

const RISK_COLOR: Record<RiskLevel, string> = {
  green: '#3A5E4C',
  yellow: '#B28034',
  red: '#8C3A2A',
};

export function NightCurve({
  range,
  risk,
  curve,
  now,
  sessionStart,
  sessionEnd,
  wakeAt,
  peak,
}: Props) {
  const W = 340;
  const H = 200;
  const padL = 8;
  const padR = 8;
  const padT = 16;
  const padB = 28;

  const { tMin, tMax, bMax, x, y, past, future, nowBac, hourTicks } = useMemo(() => {
    const tMin = Math.min(sessionStart, curve[0]?.at ?? sessionStart);
    const tMax = Math.max(
      sessionEnd,
      wakeAt ?? sessionEnd,
      curve[curve.length - 1]?.at ?? sessionEnd,
    );
    const bMax = Math.max(0.1, peak * 1.15, range.typical * 1.1);
    const x = (t: number) =>
      padL + ((t - tMin) / Math.max(1, tMax - tMin)) * (W - padL - padR);
    const y = (b: number) => padT + (1 - Math.min(1, b / bMax)) * (H - padT - padB);
    const past = curve.filter((p) => p.at <= now);
    const future = curve.filter((p) => p.at >= now);
    const nowBac = curve.find((p) => p.at >= now)?.bac ?? range.typical;
    const hourMs = 60 * 60 * 1000;
    const firstHour = Math.ceil(tMin / hourMs) * hourMs;
    const hours: number[] = [];
    for (let t = firstHour; t < tMax; t += hourMs) hours.push(t);
    return { tMin, tMax, bMax, x, y, past, future, nowBac, hourTicks: hours };
  }, [curve, now, peak, range.typical, sessionEnd, sessionStart, wakeAt]);

  const color = RISK_COLOR[risk];

  const toPath = (pts: BacSample[]) =>
    pts.length === 0
      ? ''
      : pts
          .map(
            (p, i) =>
              `${i === 0 ? 'M' : 'L'}${x(p.at).toFixed(1)},${y(p.bac).toFixed(1)}`,
          )
          .join(' ');

  const toArea = (pts: BacSample[]) => {
    if (pts.length === 0) return '';
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${toPath(pts)} L${x(last.at).toFixed(1)},${H - padB} L${x(first.at).toFixed(1)},${H - padB} Z`;
  };

  const yellowY = y(0.04);
  const redY = y(0.06);

  void tMin;
  void tMax;
  void bMax;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden>
      <defs>
        <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="curve-fill-future" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.14" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect
        x={padL}
        y={redY}
        width={W - padL - padR}
        height={H - padB - redY}
        fill="#8C3A2A"
        opacity="0.05"
      />
      <rect
        x={padL}
        y={yellowY}
        width={W - padL - padR}
        height={redY - yellowY}
        fill="#B28034"
        opacity="0.05"
      />

      {[0.04, 0.06].map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke="#C2B391"
            strokeDasharray="2 4"
            strokeOpacity="0.6"
          />
          <text
            x={W - padR}
            y={y(v) - 3}
            textAnchor="end"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            fill="#8A8374"
          >
            {v.toFixed(2)}
          </text>
        </g>
      ))}

      {hourTicks.map((t) => (
        <line
          key={t}
          x1={x(t)}
          x2={x(t)}
          y1={H - padB}
          y2={H - padB + 3}
          stroke="#8A8374"
          strokeOpacity="0.5"
        />
      ))}
      {hourTicks.map(
        (t, i) =>
          i % 2 === 0 && (
            <text
              key={`l${t}`}
              x={x(t)}
              y={H - padB + 14}
              textAnchor="middle"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fill="#8A8374"
            >
              {new Date(t).getHours().toString().padStart(2, '0')}
            </text>
          ),
      )}

      <path d={toArea(past)} fill="url(#curve-fill)" />
      <path
        d={toPath(past)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path d={toArea(future)} fill="url(#curve-fill-future)" />
      <path
        d={toPath(future)}
        fill="none"
        stroke={color}
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeDasharray="3 4"
        strokeLinecap="round"
      />

      {wakeAt && (
        <g>
          <line
            x1={x(wakeAt)}
            x2={x(wakeAt)}
            y1={padT}
            y2={H - padB}
            stroke="#5D5547"
            strokeOpacity="0.3"
            strokeDasharray="1 3"
          />
          <text
            x={x(wakeAt)}
            y={padT + 8}
            textAnchor="middle"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
            fill="#5D5547"
          >
            WAKE
          </text>
        </g>
      )}

      <line
        x1={x(now)}
        x2={x(now)}
        y1={padT}
        y2={H - padB}
        stroke="#1A1712"
        strokeOpacity="0.25"
      />
      <circle cx={x(now)} cy={y(nowBac)} r="5" fill={color} />
      <circle cx={x(now)} cy={y(nowBac)} r="9" fill={color} opacity="0.2">
        <animate
          attributeName="r"
          values="6;11;6"
          dur="2.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.35;0;0.35"
          dur="2.6s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
