import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Droplet,
  Flame,
  Gauge,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { shouldShowMorningRecap, useSession } from '@/store/useSession';
import { endedSessions, recappedSessions, type EndedSession } from '@/lib/insights';
import type { Session } from '@/types';

type Props = {
  onOpenSession?: () => void;
  onOpenRecap?: (sessionId: string) => void;
};

type InsightsView = 'patterns' | 'last_night' | 'trends';
type ChartMetric = 'nightScore' | 'peakBac' | 'waterPerDrink' | 'morningFeel';

type RecapNight = {
  session: EndedSession;
  generatedAt: number;
  nightScore: number;
  morningRating: number;
  plannedDrinks: number | null;
  loggedDrinks: number;
  totalStandardDrinks: number;
  peakBac: number;
  waterPerDrink: number;
  waterCount: number;
  hydrationScore: number;
  foodScore: number;
  paceScore: number;
  planAdherenceScore: number;
  recoveryScore: number;
  withinCap: boolean | null;
  firstDrinkAt: number | null;
  lastDrinkAt: number | null;
  stopBeforeMidnight: boolean | null;
};

type InsightCardModel = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  confidence: string;
  tone: 'purple' | 'blue' | 'green' | 'amber' | 'red';
};

type WeekPoint = {
  day: string;
  key: string;
  night: RecapNight | null;
  value: number | null;
  projected?: boolean;
};

type TrendSummary = {
  current: RecapNight[];
  previous: RecapNight[];
  weekPoints: WeekPoint[];
  avgScore: number | null;
  previousAvgScore: number | null;
  avgPeakBac: number | null;
  previousAvgPeakBac: number | null;
  avgWaterPerDrink: number | null;
  previousAvgWaterPerDrink: number | null;
  withinCapCount: number;
  withinCapTotal: number;
  currentCapStreak: number;
};

const CHART_OPTIONS: { key: ChartMetric; label: string }[] = [
  { key: 'nightScore', label: 'Night score' },
  { key: 'peakBac', label: 'Peak BAC' },
  { key: 'waterPerDrink', label: 'Water / drink' },
  { key: 'morningFeel', label: 'Morning feel' },
];

const TONE_CLASSES: Record<InsightCardModel['tone'], string> = {
  purple: 'border-[#7B4DFF]/50 bg-[radial-gradient(circle_at_top_left,rgba(123,77,255,0.26),transparent_58%),#111D2E] text-[#9D7CFF]',
  blue: 'border-[#2CA7FF]/35 bg-[radial-gradient(circle_at_top_left,rgba(44,167,255,0.18),transparent_58%),#111D2E] text-[#2CA7FF]',
  green: 'border-[#2DE67D]/35 bg-[radial-gradient(circle_at_top_left,rgba(45,230,125,0.16),transparent_58%),#111D2E] text-[#2DE67D]',
  amber: 'border-[#FFAA00]/35 bg-[radial-gradient(circle_at_top_left,rgba(255,170,0,0.16),transparent_58%),#111D2E] text-[#FFAA00]',
  red: 'border-[#FF4545]/35 bg-[radial-gradient(circle_at_top_left,rgba(255,69,69,0.15),transparent_58%),#111D2E] text-[#FF4545]',
};

export function InsightsPage({ onOpenSession, onOpenRecap }: Props) {
  const history = useSession((s) => s.history);
  const [view, setView] = useState<InsightsView>('patterns');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('nightScore');

  const model = useMemo(() => buildInsightsModel(history, chartMetric), [history, chartMetric]);
  const completedCount = model.nights.length;
  const eligibleRecap = model.unrecapped.find((session) => shouldShowMorningRecap(session));

  const headerSub =
    completedCount >= 7
      ? 'Your drinking trends are getting clearer.'
      : completedCount >= 3
        ? 'What your last 7 nights say.'
        : "We're learning from your nights.";

  return (
    <div className="mx-auto max-w-[480px] px-5 pb-28 pt-8">
      <header className="relative mb-6 min-h-[160px]">
        <div className="pr-16">
          <div className="font-mono text-[13px] font-bold uppercase tracking-[0.28em] text-[#9D7CFF]">
            Insights
          </div>
          <h1 className="mt-3 max-w-none whitespace-nowrap font-display text-[42px] leading-[1.02] tracking-[-0.02em] text-[#F3F0EA] min-[390px]:text-[44px]">
            Your patterns
          </h1>
          <p className="mt-3 max-w-[290px] text-[19px] leading-snug text-[#A9B3C3]">
            {headerSub}
          </p>
        </div>
        <div className="absolute right-0 top-1 flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full border border-[#7B4DFF]/50 bg-[#39215F]/35 text-[#9D7CFF] shadow-[0_0_34px_rgba(123,77,255,0.22)]">
          <Sparkles className="h-8 w-8" strokeWidth={1.7} />
        </div>
      </header>

      <SegmentedControl view={view} onChange={setView} />

      {model.sessions.length === 0 && (
        <EmptyState
          title="Your patterns will appear here"
          body="Complete your first session and morning recap to start learning what works for you."
          cta="Start a session"
          onClick={onOpenSession}
        />
      )}

      {model.sessions.length > 0 && completedCount === 0 && (
        <EmptyState
          title="We need your morning check-ins"
          body="Your session data is saved. Complete a morning recap so PacePlan can connect what happened with how you felt."
          cta={eligibleRecap ? 'Complete recap' : 'Check back tomorrow'}
          onClick={eligibleRecap && onOpenRecap ? () => onOpenRecap(eligibleRecap.id) : undefined}
        />
      )}

      {completedCount > 0 && (
        <>
          {view === 'patterns' && (
            <PatternsTab
              model={model}
              chartMetric={chartMetric}
              onMetricChange={setChartMetric}
            />
          )}
          {view === 'last_night' && <LastNightTab model={model} />}
          {view === 'trends' && (
            <TrendsTab
              model={model}
              chartMetric={chartMetric}
              onMetricChange={setChartMetric}
            />
          )}
        </>
      )}
    </div>
  );
}

function SegmentedControl({
  view,
  onChange,
}: {
  view: InsightsView;
  onChange: (view: InsightsView) => void;
}) {
  const items: { key: InsightsView; label: string }[] = [
    { key: 'patterns', label: 'Patterns' },
    { key: 'last_night', label: 'Last night' },
    { key: 'trends', label: 'Trends' },
  ];
  return (
    <div className="mb-7 rounded-[22px] border border-white/10 bg-[#0D1929] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={`h-[52px] rounded-[18px] text-[17px] transition ${
                active
                  ? 'bg-[#7B4DFF]/28 text-[#F3F0EA] shadow-[0_0_24px_rgba(123,77,255,0.18)]'
                  : 'text-[#A9B3C3]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PatternsTab({
  model,
  chartMetric,
  onMetricChange,
}: {
  model: ReturnType<typeof buildInsightsModel>;
  chartMetric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
}) {
  return (
    <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
      <SectionHeader icon={Brain} title="What we're learning" aside="Updated today" tone="purple" />

      <div className="-mx-5 overflow-x-auto px-5 pb-1">
        <div className="flex min-w-max gap-3">
          {model.learningCards.map((card, index) => (
            <InsightCard key={card.id} card={card} featured={index === 0} />
          ))}
        </div>
      </div>

      <LockedInsight completed={model.nights.length} />

      <SectionHeader icon={TrendingUp} title="This week at a glance" tone="purple">
        <MetricSelect value={chartMetric} onChange={onMetricChange} compact />
      </SectionHeader>

      <ChartPanel model={model} metric={chartMetric} />

      <SectionHeader icon={Trophy} title="Momentum" tone="amber" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MomentumCard
          icon={Flame}
          title={`${model.trend.currentCapStreak || 0} night${model.trend.currentCapStreak === 1 ? '' : 's'} in a row`}
          body="staying within your cap."
          streak={model.trend.currentCapStreak}
          tone="amber"
        />
        <MomentumCard
          icon={Target}
          title={isTrendingUp(model.trend) ? "You're trending up" : 'Small changes add up'}
          body={
            isTrendingUp(model.trend)
              ? 'Keep building on your best habits.'
              : 'A steadier cap and water rhythm will move the line.'
          }
          streak={null}
          tone="purple"
        />
      </div>
    </motion.main>
  );
}

function LastNightTab({ model }: { model: ReturnType<typeof buildInsightsModel> }) {
  const last = model.lastNight;
  if (!last) return null;
  const previous = model.nights.filter((night) => night.session.id !== last.session.id);
  const avgPeak = averageOrNull(previous.map((night) => night.peakBac));
  const avgWater = averageOrNull(previous.map((night) => night.waterPerDrink));
  const avgStop = averageOrNull(previous.flatMap((night) => (night.lastDrinkAt ? [minutesFromDayStart(night.lastDrinkAt)] : [])));
  const stopMinutes = last.lastDrinkAt ? minutesFromDayStart(last.lastDrinkAt) : null;
  const wins = lastNightWins(last);
  const friction = lastNightFriction(last);

  return (
    <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SectionHeader icon={Star} title="Last night" aside="How it compared." tone="purple" />

      <Panel>
        <div className="space-y-1">
          <ComparisonRow
            label="Peak BAC"
            value={formatBac(last.peakBac)}
            sub={avgPeak === null ? 'No average yet' : `Your avg ${formatBac(avgPeak)}`}
            tone={avgPeak === null || last.peakBac <= avgPeak ? 'green' : last.peakBac - avgPeak <= 0.01 ? 'amber' : 'red'}
          />
          <ComparisonRow
            label="Pace"
            value={paceLabel(last.paceScore)}
            sub={last.paceScore >= 75 ? 'Better' : 'Worth slowing'}
            tone={last.paceScore >= 75 ? 'green' : 'amber'}
          />
          <ComparisonRow
            label="Water"
            value={`${last.waterCount}`}
            sub={
              avgWater === null
                ? `${last.waterPerDrink.toFixed(1)} per drink`
                : `${deltaLabel(last.waterPerDrink - avgWater, 1)} vs avg`
            }
            tone={last.waterPerDrink >= 0.8 ? 'green' : 'amber'}
          />
          <ComparisonRow
            label="Stop time"
            value={formatTime(last.lastDrinkAt)}
            sub={
              avgStop === null || stopMinutes === null
                ? 'Still learning'
                : stopMinutes <= avgStop
                  ? 'Earlier than avg'
                  : 'Later than avg'
            }
            tone={avgStop === null || stopMinutes === null || stopMinutes <= avgStop ? 'green' : 'amber'}
          />
        </div>
      </Panel>

      <Panel title="Why you felt how you felt">
        <div className="space-y-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2DE67D]">
              Likely helped
            </div>
            <ul className="mt-2 space-y-2">
              {wins.map((item) => (
                <Bullet key={item} text={item} tone="green" />
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FFAA00]">
              Watch next time
            </div>
            <ul className="mt-2 space-y-2">
              {friction.map((item) => (
                <Bullet key={item} text={item} tone="amber" />
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel title="Morning signal">
        <div className="grid grid-cols-3 divide-x divide-white/10">
          <MiniMetric label="Score" value={`${last.nightScore}`} />
          <MiniMetric label="Feel" value={`${last.morningRating}/5`} />
          <MiniMetric label="Cap" value={last.withinCap === null ? '-' : last.withinCap ? 'Inside' : 'Pushed'} />
        </div>
      </Panel>
    </motion.main>
  );
}

function TrendsTab({
  model,
  chartMetric,
  onMetricChange,
}: {
  model: ReturnType<typeof buildInsightsModel>;
  chartMetric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
}) {
  const insights = buildTrendInsights(model);
  const tests = buildNextTests(model.nights);

  return (
    <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <SectionHeader icon={BarChart3} title="Your trend" aside="Are things improving?" tone="purple" />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHART_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onMetricChange(option.key)}
            className={`h-10 shrink-0 rounded-full border px-4 text-[13px] transition ${
              chartMetric === option.key
                ? 'border-[#7B4DFF] bg-[#7B4DFF]/18 text-[#F3F0EA]'
                : 'border-white/10 bg-[#111D2E] text-[#A9B3C3]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <ChartPanel model={model} metric={chartMetric} hideMetrics />

      <Panel title="What is changing">
        <div className="space-y-4">
          {insights.map((item) => (
            <TrendInsight key={item.title} item={item} />
          ))}
        </div>
      </Panel>

      <Panel title="What to test next" subtitle="Based on your best nights.">
        <div className="space-y-2">
          {tests.map((test) => (
            <ActionTest key={test} text={test} />
          ))}
        </div>
      </Panel>
    </motion.main>
  );
}

function EmptyState({
  title,
  body,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  onClick?: () => void;
}) {
  return (
    <Panel className="mt-5 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#7B4DFF]/35 bg-[#7B4DFF]/15 text-[#9D7CFF]">
        <Sparkles className="h-7 w-7" strokeWidth={1.7} />
      </div>
      <h2 className="mt-5 font-display text-[30px] leading-tight text-[#F3F0EA]">{title}</h2>
      <p className="mx-auto mt-3 max-w-[310px] text-[15px] leading-snug text-[#A9B3C3]">{body}</p>
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="mt-5 h-12 rounded-full bg-gradient-to-r from-[#6D5DF5] to-[#4F46E5] px-6 font-semibold text-white transition active:scale-[0.99] disabled:opacity-45"
      >
        {cta}
      </button>
    </Panel>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  aside,
  tone,
  children,
}: {
  icon: LucideIcon;
  title: string;
  aside?: string;
  tone: 'purple' | 'amber';
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon
          className={`h-5 w-5 ${tone === 'amber' ? 'text-[#FFAA00]' : 'text-[#9D7CFF]'}`}
          strokeWidth={1.9}
        />
        <div className="font-mono text-[13px] font-bold uppercase tracking-[0.22em] text-[#A9B3C3]">
          {title}
        </div>
      </div>
      {children ?? (aside && <div className="text-[13px] text-[#A9B3C3]">{aside}</div>)}
    </div>
  );
}

function InsightCard({ card, featured }: { card: InsightCardModel; featured?: boolean }) {
  const Icon = card.icon;
  return (
    <article
      className={`min-h-[214px] w-[194px] rounded-[22px] border p-[18px] shadow-card ${TONE_CLASSES[card.tone]} ${
        featured ? 'w-[210px]' : ''
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-current/35 bg-current/10">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h3 className="mt-5 font-display text-[24px] leading-[1.06] tracking-[-0.01em] text-[#F3F0EA]">
        {card.title}
      </h3>
      <p className="mt-3 text-[15px] leading-snug text-[#A9B3C3]">{card.description}</p>
      <div className="mt-6 flex items-center gap-2 text-[13px] text-[#A9B3C3]">
        <span className="h-2 w-2 rounded-full bg-current" />
        {card.confidence}
      </div>
    </article>
  );
}

function LockedInsight({ completed }: { completed: number }) {
  const locked = nextLockedInsight(completed);
  const progress = Math.min(locked.required, completed);
  const remaining = Math.max(0, locked.required - completed);
  return (
    <Panel className="flex items-center gap-4">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#7B4DFF]/15 text-[#F3F0EA]">
        <LockKeyhole className="h-6 w-6" strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[18px] font-medium text-[#F3F0EA]">{locked.title}</div>
        <p className="mt-1 text-[14px] leading-snug text-[#A9B3C3]">
          {remaining > 0
            ? `Log ${remaining} more morning${remaining === 1 ? '' : 's'} to unlock this insight.`
            : 'Unlocked. Your pattern is clear enough to use.'}
        </p>
      </div>
      <div className="w-[90px] shrink-0">
        <div className="mb-2 text-center font-mono text-[13px] text-[#A9B3C3]">
          {progress}/{locked.required}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#9D7CFF]"
            style={{ width: `${Math.min(100, (completed / locked.required) * 100)}%` }}
          />
        </div>
      </div>
    </Panel>
  );
}

function ChartPanel({
  model,
  metric,
  hideMetrics,
}: {
  model: ReturnType<typeof buildInsightsModel>;
  metric: ChartMetric;
  hideMetrics?: boolean;
}) {
  const points = model.trend.weekPoints;
  const hasData = points.some((point) => point.value !== null);
  return (
    <Panel className="p-0">
      <div className="p-4">
        {hasData ? (
          <LineChart points={points} metric={metric} />
        ) : (
          <div className="flex h-[210px] items-center justify-center text-center text-[15px] leading-snug text-[#A9B3C3]">
            Your weekly trend will appear after your next recap.
          </div>
        )}
      </div>
      {!hideMetrics && <MetricsStrip trend={model.trend} />}
    </Panel>
  );
}

function MetricSelect({
  value,
  onChange,
  compact,
}: {
  value: ChartMetric;
  onChange: (metric: ChartMetric) => void;
  compact?: boolean;
}) {
  return (
    <label className="relative shrink-0">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as ChartMetric)}
        className={`appearance-none rounded-[12px] border border-white/10 bg-[#111D2E] py-2 pl-4 pr-9 text-[#F3F0EA] outline-none ${
          compact ? 'text-[14px]' : 'text-[15px]'
        }`}
        aria-label="Chart metric"
      >
        {CHART_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A9B3C3]" />
    </label>
  );
}

function LineChart({ points, metric }: { points: WeekPoint[]; metric: ChartMetric }) {
  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]));
  const domain = chartDomain(metric, values);
  const plotted = points.map((point, index) => ({
    ...point,
    x: 36 + index * 47,
    y:
      point.value === null
        ? null
        : 156 - ((point.value - domain.min) / Math.max(1, domain.max - domain.min)) * 128,
  }));
  const linePoints = plotted.filter((point) => point.y !== null);
  const solid = linePoints.map((point) => `${point.x},${point.y}`).join(' ');
  const area =
    linePoints.length > 0
      ? `M ${linePoints[0].x} 156 L ${linePoints.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${linePoints[linePoints.length - 1].x} 156 Z`
      : '';
  let lastDataIndex = -1;
  for (let index = plotted.length - 1; index >= 0; index -= 1) {
    if (plotted[index].y !== null) {
      lastDataIndex = index;
      break;
    }
  }
  const projection =
    lastDataIndex >= 0 && lastDataIndex < plotted.length - 1
      ? `${plotted[lastDataIndex].x},${plotted[lastDataIndex].y ?? 156} ${plotted[plotted.length - 1].x},${projectedY(plotted, lastDataIndex)}`
      : '';

  return (
    <div>
      <svg viewBox="0 0 350 210" className="h-[230px] w-full overflow-visible">
        <defs>
          <linearGradient id={`area-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7B4DFF" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#7B4DFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((line) => (
          <line
            key={line}
            x1="36"
            x2="326"
            y1={28 + line * 64}
            y2={28 + line * 64}
            stroke="rgba(255,255,255,0.06)"
          />
        ))}
        <line x1="36" x2="36" y1="22" y2="156" stroke="rgba(255,255,255,0.12)" />
        <line x1="36" x2="326" y1="156" y2="156" stroke="rgba(255,255,255,0.12)" />
        {area && <path d={area} fill={`url(#area-${metric})`} />}
        {solid && (
          <polyline
            points={solid}
            fill="none"
            stroke="#9D7CFF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {projection && (
          <polyline
            points={projection}
            fill="none"
            stroke="#9D7CFF"
            strokeDasharray="5 7"
            strokeOpacity="0.45"
            strokeWidth="3"
          />
        )}
        {plotted.map((point) =>
          point.y === null ? (
            <text
              key={point.key}
              x={point.x}
              y="80"
              textAnchor="middle"
              className="fill-[#A9B3C3] font-display text-[20px]"
            >
              -
            </text>
          ) : (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r="6" fill="#E6EDF5" />
              <circle cx={point.x} cy={point.y} r="4" fill="#7B4DFF" />
              <text
                x={point.x}
                y={point.y - 15}
                textAnchor="middle"
                className={`font-mono text-[13px] ${point.value === maxValue(values) ? 'fill-[#2DE67D]' : 'fill-[#F3F0EA]'}`}
              >
                {formatChartValue(metric, point.value)}
              </text>
            </g>
          ),
        )}
        <text x="6" y="28" className="fill-[#A9B3C3] font-mono text-[12px]">
          {formatAxis(metric, domain.max)}
        </text>
        <text x="10" y="94" className="fill-[#A9B3C3] font-mono text-[12px]">
          {formatAxis(metric, (domain.max + domain.min) / 2)}
        </text>
        <text x="18" y="156" className="fill-[#A9B3C3] font-mono text-[12px]">
          {formatAxis(metric, domain.min)}
        </text>
        {plotted.map((point) => (
          <text
            key={`${point.key}-label`}
            x={point.x}
            y="196"
            textAnchor="middle"
            className="fill-[#A9B3C3] font-mono text-[13px]"
          >
            {point.day}
          </text>
        ))}
      </svg>
    </div>
  );
}

function MetricsStrip({ trend }: { trend: TrendSummary }) {
  const scoreDelta = diffPercent(trend.avgScore, trend.previousAvgScore);
  const peakDelta = diffNumber(trend.avgPeakBac, trend.previousAvgPeakBac);
  const waterDelta = diffNumber(trend.avgWaterPerDrink, trend.previousAvgWaterPerDrink);
  return (
    <div className="mx-4 mb-4 grid grid-cols-2 divide-x divide-y divide-white/10 overflow-hidden rounded-[20px] border border-white/8 bg-[#172437] sm:grid-cols-4 sm:divide-y-0">
      <MetricBox
        icon={Star}
        label="Avg score"
        value={trend.avgScore === null ? '-' : `${trend.avgScore}`}
        delta={scoreDelta === null ? 'No prior week' : `${scoreDelta >= 0 ? '↑' : '↓'} ${Math.abs(scoreDelta)}% vs last week`}
        positive={scoreDelta === null || scoreDelta >= 0}
      />
      <MetricBox
        icon={TrendingUp}
        label="Peak BAC"
        value={trend.avgPeakBac === null ? '-' : formatBac(trend.avgPeakBac)}
        delta={peakDelta === null ? 'No prior week' : `${peakDelta <= 0 ? '↓' : '↑'} ${Math.abs(peakDelta).toFixed(3)} vs last week`}
        positive={peakDelta === null || peakDelta <= 0}
      />
      <MetricBox
        icon={Droplet}
        label="Water / drink"
        value={trend.avgWaterPerDrink === null ? '-' : trend.avgWaterPerDrink.toFixed(1)}
        delta={waterDelta === null ? 'No prior week' : `${waterDelta >= 0 ? '↑' : '↓'} ${Math.abs(waterDelta).toFixed(1)} vs last week`}
        positive={waterDelta === null || waterDelta >= 0}
      />
      <MetricBox
        icon={ShieldCheck}
        label="Within cap"
        value={`${trend.withinCapCount}/${Math.max(1, trend.withinCapTotal)}`}
        delta={trend.currentCapStreak > 0 ? 'Best streak' : 'Keep building'}
        positive
      />
    </div>
  );
}

function MetricBox({
  icon: Icon,
  label,
  value,
  delta,
  positive,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#A9B3C3]">
        <Icon className="h-4 w-4 text-[#9D7CFF]" strokeWidth={1.8} />
        {label}
      </div>
      <div className="mt-3 font-display text-[36px] leading-none text-[#F3F0EA]">{value}</div>
      <div className={`mt-2 text-[13px] ${positive ? 'text-[#2DE67D]' : 'text-[#FF4545]'}`}>
        {delta}
      </div>
    </div>
  );
}

function MomentumCard({
  icon: Icon,
  title,
  body,
  streak,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  streak: number | null;
  tone: 'amber' | 'purple';
}) {
  const color = tone === 'amber' ? '#FFAA00' : '#9D7CFF';
  return (
    <Panel className="flex items-center gap-4">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border"
        style={{
          color,
          borderColor: `${color}55`,
          background: `${color}18`,
        }}
      >
        <Icon className="h-7 w-7" strokeWidth={1.7} />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[24px] leading-tight text-[#F3F0EA]">{title}</div>
        <p className="text-[15px] leading-snug text-[#A9B3C3]">{body}</p>
        {streak !== null && (
          <div className="mt-3 flex gap-1.5">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className="h-1.5 w-11 rounded-full"
                style={{ background: index < streak ? color : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-[22px] border border-white/10 bg-[#111D2E]/95 p-[18px] shadow-card ${className ?? ''}`}
    >
      {title && (
        <div className="mb-4">
          <div className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-[#A9B3C3]">
            {title}
          </div>
          {subtitle && <p className="mt-1 text-[13px] leading-snug text-[#A9B3C3]">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function ComparisonRow({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'green' | 'amber' | 'red';
}) {
  const toneClass =
    tone === 'green' ? 'text-[#2DE67D]' : tone === 'red' ? 'text-[#FF4545]' : 'text-[#FFAA00]';
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/8 py-3 last:border-b-0">
      <div>
        <div className="text-[15px] text-[#F3F0EA]">{label}</div>
        <div className="mt-1 text-[13px] text-[#A9B3C3]">{sub}</div>
      </div>
      <div className={`font-display text-[28px] leading-none ${toneClass}`}>{value}</div>
    </div>
  );
}

function Bullet({ text, tone }: { text: string; tone: 'green' | 'amber' }) {
  return (
    <li className="flex items-start gap-2 text-[15px] leading-snug text-[#A9B3C3]">
      <CheckCircle2
        className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'green' ? 'text-[#2DE67D]' : 'text-[#FFAA00]'}`}
        strokeWidth={1.8}
      />
      {text}
    </li>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 text-center first:pl-0 last:pr-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#6F7B8D]">{label}</div>
      <div className="mt-2 font-display text-[25px] leading-none text-[#F3F0EA]">{value}</div>
    </div>
  );
}

function TrendInsight({ item }: { item: InsightCardModel }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] ${iconTone(item.tone)}`}>
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div>
        <div className="text-[16px] font-semibold leading-snug text-[#F3F0EA]">{item.title}</div>
        <p className="mt-1 text-[14px] leading-snug text-[#A9B3C3]">{item.description}</p>
      </div>
    </div>
  );
}

function ActionTest({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-[#172437] p-3">
      <Target className="h-5 w-5 shrink-0 text-[#9D7CFF]" strokeWidth={1.8} />
      <span className="text-[15px] leading-snug text-[#F3F0EA]">{text}</span>
    </div>
  );
}

function buildInsightsModel(history: Session[], metric: ChartMetric) {
  const sessions = endedSessions(history);
  const nights = recappedSessions(history)
    .map(toRecapNight)
    .sort((a, b) => b.generatedAt - a.generatedAt);
  const unrecapped = sessions.filter((session) => !session.recap);
  const current = nights.slice(0, 7).reverse();
  const previous = nights.slice(7, 14).reverse();
  const trend = buildTrendSummary(current, previous, metric);
  return {
    sessions,
    nights,
    current,
    previous,
    unrecapped,
    lastNight: nights[0] ?? null,
    learningCards: buildLearningCards(nights),
    trend,
  };
}

function toRecapNight(session: EndedSession): RecapNight {
  const plannedDrinks =
    typeof session.plannedDrinkCap === 'number' ? session.plannedDrinkCap : null;
  const loggedDrinks = session.drinks.length;
  const totalStandardDrinks = session.drinks.reduce((sum, drink) => sum + drink.standardDrinks, 0);
  const waterCount = session.water.length;
  const waterPerDrink = totalStandardDrinks > 0 ? waterCount / totalStandardDrinks : 0;
  const peakBac = session.peakBac ?? 0;
  const firstDrinkAt = session.firstDrinkAt ?? firstAt(session.drinks);
  const lastDrinkAt = session.lastDrinkAt ?? lastAt(session.drinks);
  const hydrationScore = clamp(waterPerDrink * 100, loggedDrinks > 0 ? 20 : 100, 100);
  const foodScore = session.food.some((food) => food.size === 'meal')
    ? 100
    : session.food.some((food) => food.size === 'snack')
      ? 70
      : loggedDrinks === 0
        ? 100
        : 35;
  const paceScore = paceScoreFor(session);
  const planAdherenceScore =
    plannedDrinks === null
      ? 80
      : clamp(100 - Math.max(0, loggedDrinks - plannedDrinks) * 28, 20, 100);
  const safetyScore = peakBac <= 0.05 ? 100 : peakBac <= 0.075 ? 76 : peakBac <= 0.1 ? 48 : 24;
  const fallbackScore = Math.round(
    planAdherenceScore * 0.3 + paceScore * 0.2 + hydrationScore * 0.2 + foodScore * 0.1 + safetyScore * 0.2,
  );
  const withinCap = plannedDrinks === null ? null : loggedDrinks <= plannedDrinks;
  return {
    session,
    generatedAt: session.recap?.submittedAt ?? session.endedAt,
    nightScore: session.recap?.nightScore ?? fallbackScore,
    morningRating: session.recap?.rating ?? Math.round(fallbackScore / 20),
    plannedDrinks,
    loggedDrinks,
    totalStandardDrinks,
    peakBac,
    waterPerDrink,
    waterCount,
    hydrationScore,
    foodScore,
    paceScore,
    planAdherenceScore,
    recoveryScore: session.recap?.rating ? session.recap.rating * 20 : fallbackScore,
    withinCap,
    firstDrinkAt,
    lastDrinkAt,
    stopBeforeMidnight:
      lastDrinkAt === null ? null : lastDrinkAt < nextLocalMidnight(session.startedAt),
  };
}

function buildLearningCards(nights: RecapNight[]): InsightCardModel[] {
  const sample = nights.length;
  const rough = nights.filter((night) => night.morningRating <= 2);
  const good = nights.filter((night) => night.morningRating >= 4);
  const highHydration = nights.filter((night) => night.hydrationScore >= 75);
  const lowHydration = nights.filter((night) => night.hydrationScore < 55);
  const roughPeak = averageOrNull(rough.map((night) => night.peakBac));
  const goodPeak = averageOrNull(good.map((night) => night.peakBac));
  const hydrationDelta =
    highHydration.length && lowHydration.length
      ? avg(highHydration.map((night) => night.morningRating)) - avg(lowHydration.map((night) => night.morningRating))
      : null;
  const bestBeforeMidnight =
    good.length > 0
      ? good.filter((night) => night.stopBeforeMidnight === true).length / good.length
      : 0;

  const peakCard: InsightCardModel =
    roughPeak !== null && roughPeak >= 0.075
      ? {
          id: 'peak-risk',
          icon: TrendingUp,
          title: 'Peak BAC above 0.075 hits you hard',
          description: 'You feel rough the next day when your peak goes over 0.075.',
          confidence: confidenceLabel(sample, goodPeak !== null ? roughPeak - goodPeak : 0.7),
          tone: 'purple',
        }
      : {
          id: 'peak-room',
          icon: Gauge,
          title: 'Lower peaks give you more room',
          description: 'Your cleaner mornings tend to come from steadier BAC curves.',
          confidence: confidenceLabel(sample, 0.45),
          tone: 'purple',
        };

  const waterCard: InsightCardModel =
    hydrationDelta !== null && hydrationDelta > 0
      ? {
          id: 'water',
          icon: Droplet,
          title: 'Water makes a real difference',
          description: 'You feel better when you log at least 1 water per drink.',
          confidence: confidenceLabel(sample, hydrationDelta / 4),
          tone: 'blue',
        }
      : {
          id: 'water-building',
          icon: Droplet,
          title: 'Water is the next signal to build',
          description: 'More water logs will show how hydration changes your mornings.',
          confidence: confidenceLabel(sample, 0.25),
          tone: 'blue',
        };

  const stopCard: InsightCardModel =
    bestBeforeMidnight >= 0.6
      ? {
          id: 'stop-time',
          icon: Clock3,
          title: 'Stopping earlier helps',
          description: 'Your best mornings happen when you stop before midnight.',
          confidence: confidenceLabel(sample, bestBeforeMidnight),
          tone: 'green',
        }
      : {
          id: 'pace',
          icon: Clock3,
          title: 'A slower pace looks protective',
          description: 'More space between rounds gives your morning more margin.',
          confidence: confidenceLabel(sample, 0.35),
          tone: 'green',
        };

  return [peakCard, waterCard, stopCard];
}

function buildTrendSummary(
  current: RecapNight[],
  previous: RecapNight[],
  metric: ChartMetric,
): TrendSummary {
  const weekPoints = buildWeekPoints(current, metric);
  const capped = current.filter((night) => night.withinCap !== null);
  return {
    current,
    previous,
    weekPoints,
    avgScore: roundedAverage(current.map((night) => night.nightScore)),
    previousAvgScore: roundedAverage(previous.map((night) => night.nightScore)),
    avgPeakBac: averageOrNull(current.map((night) => night.peakBac)),
    previousAvgPeakBac: averageOrNull(previous.map((night) => night.peakBac)),
    avgWaterPerDrink: averageOrNull(current.map((night) => night.waterPerDrink)),
    previousAvgWaterPerDrink: averageOrNull(previous.map((night) => night.waterPerDrink)),
    withinCapCount: capped.filter((night) => night.withinCap).length,
    withinCapTotal: capped.length,
    currentCapStreak: capStreak(current),
  };
}

function buildWeekPoints(current: RecapNight[], metric: ChartMetric): WeekPoint[] {
  const now = new Date();
  const monday = startOfWeek(now);
  const byDay = new Map<string, RecapNight>();
  for (const night of current) {
    const marker = night.session.wakeAtMs ?? night.session.endedAt;
    const key = dayKey(new Date(marker));
    const existing = byDay.get(key);
    if (!existing || existing.generatedAt < night.generatedAt) byDay.set(key, night);
  }
  const previousValues = current.map((night) => metricValue(night, metric));
  const projection = previousValues.length ? avg(previousValues) * 0.92 : null;
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
    const key = dayKey(date);
    const night = byDay.get(key) ?? null;
    const isFuture = date > now;
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
      key,
      night,
      value: night ? metricValue(night, metric) : isFuture ? null : null,
      projected: isFuture && projection !== null,
    };
  });
}

function buildTrendInsights(model: ReturnType<typeof buildInsightsModel>): InsightCardModel[] {
  const scoreDelta = diffPercent(model.trend.avgScore, model.trend.previousAvgScore);
  const peakDelta = diffNumber(model.trend.avgPeakBac, model.trend.previousAvgPeakBac);
  const waterDelta = diffNumber(model.trend.avgWaterPerDrink, model.trend.previousAvgWaterPerDrink);
  return [
    {
      id: 'score-trend',
      icon: BarChart3,
      title:
        scoreDelta !== null && scoreDelta > 0
          ? `Your average score is up ${scoreDelta}%`
          : 'Your average score is taking shape',
      description: 'You are making better choices more consistently.',
      confidence: 'Trend',
      tone: scoreDelta !== null && scoreDelta < 0 ? 'amber' : 'purple',
    },
    {
      id: 'peak-trend',
      icon: TrendingUp,
      title:
        peakDelta !== null && peakDelta < 0
          ? 'Your peak BAC is trending lower'
          : 'Peak BAC is still the key watchpoint',
      description: 'Fewer spikes, better control.',
      confidence: 'Trend',
      tone: peakDelta !== null && peakDelta > 0 ? 'amber' : 'green',
    },
    {
      id: 'water-trend',
      icon: Droplet,
      title:
        waterDelta !== null && waterDelta >= 0
          ? 'Water rhythm is improving'
          : 'More water would sharpen recovery',
      description: 'Your mornings improve when hydration stays visible.',
      confidence: 'Trend',
      tone: 'blue',
    },
  ];
}

function buildNextTests(nights: RecapNight[]): string[] {
  const best = nights.filter((night) => night.morningRating >= 4);
  const avgBestWater = averageOrNull(best.map((night) => night.waterPerDrink)) ?? 0;
  const bestStopEarly =
    best.length > 0 && best.filter((night) => night.stopBeforeMidnight).length / best.length >= 0.5;
  const tests = [
    avgBestWater >= 0.8
      ? 'Drink 1 water before your 2nd drink'
      : 'Log water earlier so the pattern becomes clearer',
    bestStopEarly ? 'Aim to stop before midnight' : 'Set a firm stop time before you start',
  ];
  if (nights.some((night) => night.foodScore >= 80 && night.morningRating >= 4)) {
    tests.push('Eat before the first drink');
  } else {
    tests.push('Add a meal before the night gets moving');
  }
  return tests;
}

function lastNightWins(night: RecapNight): string[] {
  const wins: string[] = [];
  if (night.withinCap) wins.push('You stayed within your plan');
  if (night.paceScore >= 75) wins.push('You kept a steadier pace');
  if (night.hydrationScore >= 75) wins.push('Water stayed visible through the night');
  if (night.foodScore >= 80) wins.push('Food helped soften the curve');
  return wins.length ? wins.slice(0, 3) : ['You completed the recap, so the next plan gets smarter'];
}

function lastNightFriction(night: RecapNight): string[] {
  const items: string[] = [];
  if (night.withinCap === false) items.push('You pushed past your plan');
  if (night.peakBac >= 0.075) items.push('Your peak ran higher than usual');
  if (night.hydrationScore < 65) items.push('Water dropped later in the night');
  if (night.stopBeforeMidnight === false) items.push('A later stop time left less recovery room');
  return items.length ? items.slice(0, 3) : ['No major friction stood out'];
}

function nextLockedInsight(completed: number): { title: string; required: number } {
  const locked = [
    { title: 'Your best stop time', required: 5 },
    { title: 'Your ideal water rhythm', required: 5 },
    { title: 'Your ideal drink limit', required: 7 },
    { title: 'Your hangover trigger zone', required: 7 },
  ];
  return locked.find((item) => completed < item.required) ?? locked[2];
}

function paceScoreFor(session: Session): number {
  if (session.drinks.length < 2) return 100;
  const sorted = [...session.drinks].sort((a, b) => a.at - b.at);
  const gaps = sorted.slice(1).map((drink, index) => (drink.at - sorted[index].at) / 60_000);
  const averageGap = avg(gaps);
  if (averageGap >= 50) return 100;
  if (averageGap >= 40) return 88;
  if (averageGap >= 30) return 74;
  if (averageGap >= 20) return 55;
  return 35;
}

function capStreak(nights: RecapNight[]): number {
  let streak = 0;
  for (const night of [...nights].sort((a, b) => b.generatedAt - a.generatedAt)) {
    if (night.withinCap !== true) break;
    streak += 1;
  }
  return streak;
}

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function firstAt(items: { at: number }[]): number | null {
  return items.length ? Math.min(...items.map((item) => item.at)) : null;
}

function lastAt(items: { at: number }[]): number | null {
  return items.length ? Math.max(...items.map((item) => item.at)) : null;
}

function nextLocalMidnight(ms: number): number {
  const date = new Date(ms);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

function minutesFromDayStart(ms: number): number {
  const date = new Date(ms);
  return date.getHours() * 60 + date.getMinutes();
}

function metricValue(night: RecapNight, metric: ChartMetric): number {
  if (metric === 'peakBac') return night.peakBac;
  if (metric === 'waterPerDrink') return night.waterPerDrink;
  if (metric === 'morningFeel') return night.morningRating;
  return night.nightScore;
}

function chartDomain(metric: ChartMetric, values: number[]): { min: number; max: number } {
  if (metric === 'peakBac') return { min: 0, max: Math.max(0.1, ...values) };
  if (metric === 'waterPerDrink') return { min: 0, max: Math.max(1.5, ...values) };
  if (metric === 'morningFeel') return { min: 0, max: 5 };
  return { min: 0, max: 100 };
}

function projectedY(points: Array<{ y: number | null }>, lastDataIndex: number): number {
  const last = points[lastDataIndex].y ?? 156;
  return Math.min(156, last + 36);
}

function maxValue(values: number[]): number {
  return values.length ? Math.max(...values) : 0;
}

function formatChartValue(metric: ChartMetric, value: number | null): string {
  if (value === null) return '-';
  if (metric === 'peakBac') return value.toFixed(3);
  if (metric === 'waterPerDrink') return value.toFixed(1);
  return Math.round(value).toString();
}

function formatAxis(metric: ChartMetric, value: number): string {
  if (metric === 'peakBac') return value.toFixed(2);
  if (metric === 'waterPerDrink') return value.toFixed(1);
  return Math.round(value).toString();
}

function formatBac(value: number): string {
  return value.toFixed(3);
}

function formatTime(ms: number | null): string {
  if (!ms) return '-';
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function confidenceLabel(sampleSize: number, correlationStrength: number): string {
  if (sampleSize < 3) return 'Early pattern';
  if (sampleSize < 7) return 'Getting clearer';
  if (correlationStrength >= 0.65) return 'Strong signal';
  return 'Getting clearer';
}

function paceLabel(score: number): string {
  if (score >= 85) return 'Slower';
  if (score >= 65) return 'Steady';
  return 'Fast';
}

function iconTone(tone: InsightCardModel['tone']): string {
  if (tone === 'green') return 'bg-[#2DE67D]/12 text-[#2DE67D]';
  if (tone === 'blue') return 'bg-[#2CA7FF]/12 text-[#2CA7FF]';
  if (tone === 'amber') return 'bg-[#FFAA00]/12 text-[#FFAA00]';
  if (tone === 'red') return 'bg-[#FF4545]/12 text-[#FF4545]';
  return 'bg-[#7B4DFF]/15 text-[#9D7CFF]';
}

function isTrendingUp(trend: TrendSummary): boolean {
  if (trend.avgScore === null || trend.previousAvgScore === null) return trend.current.length > 0;
  return trend.avgScore >= trend.previousAvgScore;
}

function diffPercent(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function diffNumber(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  return current - previous;
}

function deltaLabel(value: number, decimals = 0): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${Math.abs(value).toFixed(decimals)}`;
}

function averageOrNull(values: number[]): number | null {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length ? avg(filtered) : null;
}

function roundedAverage(values: number[]): number | null {
  const average = averageOrNull(values);
  return average === null ? null : Math.round(average);
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
