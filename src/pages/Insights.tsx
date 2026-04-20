import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Frown, Laugh, Droplets, Utensils, type LucideIcon } from 'lucide-react';
import { useSession } from '@/store/useSession';
import { riskFor } from '@/lib/bac';
import {
  compareMornings,
  computeAggregates,
  drinkTypeImpacts,
  helperImpacts,
  topSymptoms,
  type HelperImpact,
  type MorningBucket,
} from '@/lib/insights';
import type { RiskLevel } from '@/types';

const RISK_TEXT: Record<RiskLevel, string> = {
  green: 'text-risk-green',
  yellow: 'text-risk-yellow',
  red: 'text-risk-red',
};

export function InsightsPage() {
  const history = useSession((s) => s.history);

  const { aggregates, mornings, symptoms, helpers, drinkTypes } = useMemo(
    () => ({
      aggregates: computeAggregates(history),
      mornings: compareMornings(history),
      symptoms: topSymptoms(history),
      helpers: helperImpacts(history),
      drinkTypes: drinkTypeImpacts(history),
    }),
    [history]
  );

  const n = aggregates.totalNights;

  return (
    <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28">
      <header className="mb-6">
        <div className="eyebrow">THE PATTERN</div>
        <h1 className="font-display text-[38px] leading-[1.05] tracking-[-0.02em] text-ink mt-2">
          <span className="hb-italic">What your</span>{' '}
          <span className="tabular-nums">{n}</span>{' '}
          <span>{n === 1 ? 'night says.' : 'nights say.'}</span>
        </h1>
      </header>

      {n === 0 ? (
        <EmptyState message="Nothing to pattern yet." sub="End a session to start learning your shape." />
      ) : (
        <div className="space-y-4">
          <AggregatesCard
            avgRating={aggregates.avgRating}
            avgPeakBac={aggregates.avgPeakBac}
            avgStdDrinks={aggregates.avgStdDrinks}
            totalWithRecap={aggregates.totalWithRecap}
          />

          {aggregates.totalWithRecap === 0 && (
            <div className="rounded-[20px] border border-line bg-bg-card p-5">
              <div className="eyebrow mb-2">NEEDS VERDICTS</div>
              <p className="font-display italic text-[15px] text-ink-muted leading-snug">
                Log a morning recap after a session and we'll start
                connecting the dots.
              </p>
            </div>
          )}

          <MorningsComparisonCard
            rough={mornings.rough}
            good={mornings.good}
          />

          <SymptomsCard
            symptoms={symptoms}
            totalRecaps={aggregates.totalWithRecap}
          />

          <HelpersCard helpers={helpers} />

          <DrinkPatternsCard drinkTypes={drinkTypes} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-bg-card p-8 text-center">
      <p className="font-display italic text-ink-muted text-lg leading-snug">
        {message}
      </p>
      <p className="text-xs text-ink-dim mt-2 tracking-wide">{sub}</p>
    </div>
  );
}

function AggregatesCard({
  avgRating,
  avgPeakBac,
  avgStdDrinks,
  totalWithRecap,
}: {
  avgRating: number | null;
  avgPeakBac: number | null;
  avgStdDrinks: number | null;
  totalWithRecap: number;
}) {
  const peakRisk = avgPeakBac !== null ? riskFor(avgPeakBac) : 'green';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-line bg-bg-card p-5"
    >
      <div className="eyebrow mb-4">ON AVERAGE</div>
      <div className="grid grid-cols-3 gap-3">
        <StatCell
          label="VERDICT"
          value={avgRating !== null ? avgRating.toFixed(1) : '—'}
          sub={totalWithRecap > 0 ? `of 5 · n=${totalWithRecap}` : 'no recaps yet'}
        />
        <StatCell
          label="PEAK"
          value={avgPeakBac !== null ? avgPeakBac.toFixed(3) : '—'}
          valueClass={avgPeakBac !== null ? RISK_TEXT[peakRisk] : undefined}
        />
        <StatCell
          label="DRINKS"
          value={avgStdDrinks !== null ? avgStdDrinks.toFixed(1) : '—'}
          sub="std"
        />
      </div>
    </motion.div>
  );
}

function StatCell({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim">
        {label}
      </div>
      <div
        className={`font-display tabular-nums text-[26px] leading-none mt-1.5 ${
          valueClass ?? 'text-ink'
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] text-ink-dim tabular-nums mt-1 tracking-tight">
          {sub}
        </div>
      )}
    </div>
  );
}

function MorningsComparisonCard({
  rough,
  good,
}: {
  rough: MorningBucket | null;
  good: MorningBucket | null;
}) {
  if (!rough && !good) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-[20px] border border-line bg-bg-card p-5"
    >
      <div className="eyebrow mb-4">MORNINGS</div>
      <div className="grid grid-cols-2 gap-3">
        <BucketColumn
          icon={Frown}
          iconClass="text-risk-red"
          title="Rough"
          sub="rated 1–2"
          bucket={rough}
        />
        <BucketColumn
          icon={Laugh}
          iconClass="text-risk-green"
          title="Good"
          sub="rated 4–5"
          bucket={good}
        />
      </div>
      {rough && good && (
        <p className="font-mono text-[11px] text-ink-dim mt-4 leading-relaxed tracking-tight">
          Rough mornings average {(rough.avgPeakBac).toFixed(3)} peak vs{' '}
          {(good.avgPeakBac).toFixed(3)} on good ones —{' '}
          {rough.avgPeakBac > good.avgPeakBac
            ? 'higher peaks do hurt you.'
            : 'peak alone isn\'t the story here.'}
        </p>
      )}
    </motion.div>
  );
}

function BucketColumn({
  icon: Icon,
  iconClass,
  title,
  sub,
  bucket,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  sub: string;
  bucket: MorningBucket | null;
}) {
  return (
    <div className="rounded-[14px] border border-line bg-bg-elev p-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <div className="font-display text-[15px] text-ink leading-none">{title}</div>
      </div>
      <div className="font-mono text-[10px] text-ink-dim mt-1 tracking-tight">{sub}</div>
      {bucket ? (
        <dl className="mt-3 space-y-1.5">
          <MiniRow label="peak" value={bucket.avgPeakBac.toFixed(3)} />
          <MiniRow label="drinks" value={`${bucket.avgStdDrinks.toFixed(1)} std`} />
          <MiniRow
            label="meal"
            value={`${Math.round(bucket.mealRate * 100)}%`}
          />
          <MiniRow
            label="short on water"
            value={bucket.avgWaterDeficit.toFixed(1)}
          />
        </dl>
      ) : (
        <div className="mt-3 font-mono text-[11px] text-ink-dim tracking-tight">
          —
        </div>
      )}
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-mono text-[10px] text-ink-dim tracking-tight">{label}</span>
      <span className="font-mono tabular-nums text-[12px] text-ink">{value}</span>
    </div>
  );
}

function SymptomsCard({
  symptoms,
  totalRecaps,
}: {
  symptoms: ReturnType<typeof topSymptoms>;
  totalRecaps: number;
}) {
  if (symptoms.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-[20px] border border-line bg-bg-card p-5"
    >
      <div className="eyebrow mb-3">WHAT YOU FEEL</div>
      <ul className="space-y-2.5">
        {symptoms.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-[15px] text-ink">{s.label}</span>
                <span className="font-mono tabular-nums text-[11px] text-ink-muted tracking-tight">
                  {s.count}/{totalRecaps}
                </span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-bg-elev overflow-hidden">
                <div
                  className="h-full bg-accent/70"
                  style={{ width: `${Math.round(s.pct * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

const HELPER_ICON: Record<string, LucideIcon> = {
  'Eating a meal': Utensils,
  'Staying on water': Droplets,
};

function HelpersCard({ helpers }: { helpers: HelperImpact[] }) {
  if (helpers.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-[20px] border border-line bg-bg-card p-5"
    >
      <div className="eyebrow mb-4">WHAT SEEMS TO HELP</div>
      <ul className="space-y-4">
        {helpers.map((h) => {
          const Icon = HELPER_ICON[h.label] ?? Droplets;
          const better = h.delta > 0.3;
          const worse = h.delta < -0.3;
          const tone = better
            ? 'text-risk-green'
            : worse
              ? 'text-risk-red'
              : 'text-ink-muted';
          const sign = h.delta > 0 ? '+' : '';
          return (
            <li key={h.label} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full border border-line bg-bg-elev flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-ink-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[15px] text-ink leading-tight">
                  {h.label}
                </div>
                <div className="font-mono text-[11px] text-ink-dim mt-0.5 tracking-tight">
                  with {h.withAvgRating.toFixed(1)} · without{' '}
                  {h.withoutAvgRating.toFixed(1)}
                </div>
              </div>
              <div className={`font-mono tabular-nums text-[13px] ${tone} shrink-0`}>
                {sign}
                {h.delta.toFixed(1)}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="font-mono text-[10px] text-ink-dim mt-4 leading-relaxed tracking-tight">
        Change in next-morning rating when this was in play.
      </p>
    </motion.div>
  );
}

function DrinkPatternsCard({
  drinkTypes,
}: {
  drinkTypes: ReturnType<typeof drinkTypeImpacts>;
}) {
  if (drinkTypes.length < 2) return null;
  const worst = drinkTypes[0];
  const best = drinkTypes[drinkTypes.length - 1];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-[20px] border border-line bg-bg-card p-5"
    >
      <div className="eyebrow mb-3">BY DRINK</div>
      <ul className="divide-y divide-line/70">
        {drinkTypes.map((d) => (
          <li
            key={d.type}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="flex-1 min-w-0">
              <div className="font-display text-[15px] text-ink leading-tight">
                {d.label}
              </div>
              <div className="font-mono text-[10px] text-ink-dim mt-0.5 tracking-tight">
                {d.sessionCount}{' '}
                {d.sessionCount === 1 ? 'night' : 'nights'}
              </div>
            </div>
            <div className="font-mono tabular-nums text-[14px] text-ink shrink-0">
              {d.avgRating.toFixed(1)}
              <span className="text-ink-dim text-[10px]"> /5</span>
            </div>
          </li>
        ))}
      </ul>
      {worst !== best && (
        <p className="font-mono text-[10px] text-ink-dim mt-4 leading-relaxed tracking-tight">
          {best.label} nights rate {best.avgRating.toFixed(1)} —{' '}
          {worst.label} nights rate {worst.avgRating.toFixed(1)}.
        </p>
      )}
    </motion.div>
  );
}
