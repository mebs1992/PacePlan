import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplet,
  Edit3,
  FlaskConical,
  Gauge,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import {
  BETA_TYPICAL,
  bacCurve,
  computeBacAt,
  projectedSoberAt,
  safeToDriveAt,
} from '@/lib/bac';
import { endedSessions } from '@/lib/insights';
import type {
  BacSample,
  DrinkEntry,
  FoodEntry,
  HangoverRecap,
  Profile,
  Session,
  Symptom,
} from '@/types';

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const RATINGS: {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  tone: string;
}[] = [
  { value: 1, label: 'Wrecked', tone: 'text-risk-red' },
  { value: 2, label: 'Rough', tone: 'text-risk-red' },
  { value: 3, label: 'Okay', tone: 'text-risk-yellow' },
  { value: 4, label: 'Good', tone: 'text-risk-green' },
  { value: 5, label: 'Great', tone: 'text-risk-green' },
];

const SYMPTOMS: { key: Symptom; label: string }[] = [
  { key: 'headache', label: 'Headache' },
  { key: 'nausea', label: 'Nausea' },
  { key: 'tired', label: 'Tired' },
  { key: 'dehydrated', label: 'Dehydrated' },
  { key: 'poor_sleep', label: 'Poor sleep' },
  { key: 'brain_fog', label: 'Brain fog' },
  { key: 'sore_stomach', label: 'Sore stomach' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'fine', label: 'Fine' },
];

type Props = {
  sessionId: string;
  onDismiss: () => void;
};

type RecapView = 'summary' | 'breakdown' | 'trends';

type ScoreBreakdown = {
  nightScore: number;
  planScore: number;
  paceScore: number;
  hydrationScore: number;
  foodScore: number;
  bacSafetyScore: number;
};

type InsightItem = {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: string;
  status: 'good' | 'watch';
};

type BarItem = {
  label: string;
  value: number;
  impact: 'High impact' | 'Medium impact';
};

type MorningModel = ScoreBreakdown & {
  dateLabel: string;
  firstName: string;
  scoreTitle: string;
  scoreBody: string;
  plannedDrinks: number | null;
  loggedDrinks: number;
  totalStd: number;
  peakBac: number;
  peakAt: number | null;
  endBac: number;
  underLimitAt: number | null;
  soberAt: number | null;
  firstDrinkAt: number | null;
  lastDrinkAt: number | null;
  wokeAt: number;
  stopTimeLabel: string;
  paceLabel: string;
  hydrationLabel: string;
  foodLabel: string;
  recoveryScore: number;
  driveSafeLabel: string;
  driveSafeDetail: string;
  tomorrowRiskLabel: string;
  readinessLabel: string;
  topWinTitle: string;
  topWinBody: string;
  keyInsights: InsightItem[];
  helped: BarItem[];
  improvements: InsightItem[];
  curve: BacSample[];
};

type TrendPoint = {
  label: string;
  score: number | null;
  peakBac: number | null;
  active: boolean;
};

type TrendModel = {
  points: TrendPoint[];
  avgScore: number | null;
  bestScore: number | null;
  bestLabel: string;
  improving: boolean;
};

export function MorningRecap({ sessionId, onDismiss }: Props) {
  const profile = useProfile((s) => s.profile)!;
  const history = useSession((s) => s.history);
  const submitRecap = useSession((s) => s.submitRecap);
  const session = useMemo(
    () => history.find((entry) => entry.id === sessionId),
    [history, sessionId],
  );

  const model = useMemo(
    () => (session ? buildMorningModel(profile, session) : null),
    [profile, session],
  );
  const trend = useMemo(
    () => (session && model ? buildTrendModel(profile, history, session.id) : null),
    [history, model, profile, session],
  );

  const [view, setView] = useState<RecapView>('summary');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(
    session?.recap?.rating ?? null,
  );
  const [symptoms, setSymptoms] = useState<Set<Symptom>>(
    () => new Set(session?.recap?.symptoms ?? []),
  );
  const [note, setNote] = useState(session?.recap?.note ?? '');

  if (!session || !model || !trend) return null;
  const nightScore = model.nightScore;

  function toggle(symptom: Symptom) {
    const next = new Set(symptoms);
    if (next.has(symptom)) {
      next.delete(symptom);
    } else if (symptom === 'fine') {
      next.clear();
      next.add('fine');
    } else {
      next.delete('fine');
      next.add(symptom);
    }
    setSymptoms(next);
  }

  function submit() {
    if (rating === null) return;
    const recap: HangoverRecap = {
      rating,
      symptoms: Array.from(symptoms),
      note: note.trim() || undefined,
      nightScore,
      submittedAt: Date.now(),
    };
    submitRecap(sessionId, recap);
    onDismiss();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-y-auto bg-[#07111F]"
      >
        <div className="mx-auto min-h-full max-w-[430px] px-5 pb-12 pt-6">
          <header className="flex items-start justify-between pt-1">
            <div>
              <div className="eyebrow">{viewLabel(view)}</div>
              <div className="mt-1 font-mono text-[12px] tracking-tight text-ink-muted">
                {model.dateLabel}
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg-card/90 text-ink-muted transition hover:bg-bg-elev"
              aria-label="Dismiss recap"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {view === 'summary' && (
            <SummaryView
              model={model}
              rating={rating}
              symptoms={symptoms}
              onRating={setRating}
              onToggleSymptom={toggle}
              onBreakdown={() => setView('breakdown')}
              onDone={rating === null ? onDismiss : submit}
            />
          )}

          {view === 'breakdown' && (
            <BreakdownView
              model={model}
              onBack={() => setView('summary')}
              onTrends={() => setView('trends')}
            />
          )}

          {view === 'trends' && (
            <TrendsView
              model={model}
              trend={trend}
              note={note}
              onNote={setNote}
              onBack={() => setView('breakdown')}
              onSubmit={submit}
              canSubmit={rating !== null}
              onSkip={onDismiss}
            />
          )}

          <p className="mt-5 text-center font-display text-[13px] italic leading-snug text-ink-dim">
            Estimates only. Never use this as proof that you can drive.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function SummaryView({
  model,
  rating,
  symptoms,
  onRating,
  onToggleSymptom,
  onBreakdown,
  onDone,
}: {
  model: MorningModel;
  rating: 1 | 2 | 3 | 4 | 5 | null;
  symptoms: Set<Symptom>;
  onRating: (rating: 1 | 2 | 3 | 4 | 5) => void;
  onToggleSymptom: (symptom: Symptom) => void;
  onBreakdown: () => void;
  onDone: () => void;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-7 space-y-4"
    >
      <div>
        <h1 className="font-display text-[38px] leading-[1.03] tracking-[-0.02em] text-ink">
          Good morning,
          <br />
          <span className="text-[#9B7CFF]">{model.firstName}.</span>
        </h1>
        <p className="mt-3 max-w-[300px] font-display text-[16px] italic leading-snug text-ink-muted">
          Here is how it went and how you can do even better.
        </p>
      </div>

      <CardShell title="Overview">
        <div className="flex items-center gap-5">
          <ScoreRing score={model.nightScore} />
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
              Night score
            </div>
            <div className="mt-1 font-display text-[27px] leading-none text-ink">
              {model.scoreTitle}
            </div>
            <p className="mt-2 text-[14px] leading-snug text-ink-muted">
              {model.scoreBody}
            </p>
          </div>
        </div>
        <p className="mt-5 text-[14px] leading-snug text-ink-muted">
          You stayed in a safe range and woke up in a good place.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MetricTile
            label="Drinks"
            value={`${model.loggedDrinks}`}
            sub={
              model.plannedDrinks
                ? `Planned ${model.plannedDrinks}`
                : `${model.totalStd.toFixed(1)} std`
            }
          />
          <MetricTile
            label="Peak BAC"
            value={formatBac(model.peakBac)}
            sub={model.peakBac <= 0.05 ? 'On track' : 'Watch'}
            tone={model.peakBac <= 0.05 ? 'green' : 'yellow'}
          />
          <MetricTile
            label="End BAC"
            value={formatBac(model.endBac)}
            sub={model.endBac <= 0.05 ? 'Safe' : 'Over 0.05'}
            tone={model.endBac <= 0.05 ? 'green' : 'yellow'}
          />
        </div>
      </CardShell>

      <CardShell title="Key insights">
        <div className="space-y-2">
          {model.keyInsights.map((item) => (
            <InsightRow key={item.title} item={item} />
          ))}
        </div>
      </CardShell>

      <CardShell title="How do you feel?">
        <div className="grid grid-cols-5 gap-1.5">
          {RATINGS.map((item) => {
            const active = rating === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onRating(item.value)}
                className={`rounded-[16px] border px-1 py-3 text-center transition ${
                  active
                    ? 'border-accent bg-accent/15 shadow-fab'
                    : 'border-line bg-[#0B1627] text-ink-muted'
                }`}
              >
                <div className={`font-display text-[26px] leading-none ${active ? 'text-ink' : 'text-ink-muted'}`}>
                  {item.value}
                </div>
                <div className={`mt-1 font-mono text-[8px] uppercase tracking-[0.1em] ${active ? item.tone : 'text-ink-dim'}`}>
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {SYMPTOMS.map((item) => {
            const active = symptoms.has(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onToggleSymptom(item.key)}
                className={`rounded-full border px-3 py-2 text-[12px] transition ${
                  active
                    ? 'border-accent bg-accent/15 text-ink'
                    : 'border-line bg-[#0B1627] text-ink-muted'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </CardShell>

      <CardShell title="Recovery status">
        <div className="font-display text-[24px] leading-none text-ink">
          You are {model.recoveryScore}% recovered
        </div>
        <p className="mt-2 text-[14px] text-ink-muted">Keep it up today.</p>
        <Progress value={model.recoveryScore} tone="indigo" className="mt-4" />
        <div className="mt-4 grid grid-cols-2 gap-2">
          <SmallStatus
            icon={Car}
            label="Drive safe in"
            value={model.driveSafeLabel}
            sub={model.driveSafeDetail}
          />
          <SmallStatus
            icon={Droplet}
            label="Hydration"
            value={model.hydrationLabel}
            sub="Keep it steady"
          />
        </div>
      </CardShell>

      <CardShell title="Top win">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">
            <Trophy className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-display text-[23px] leading-none text-ink">
              {model.topWinTitle}
            </div>
            <p className="mt-2 text-[14px] leading-snug text-ink-muted">
              {model.topWinBody}
            </p>
          </div>
        </div>
      </CardShell>

      <button
        type="button"
        onClick={onBreakdown}
        className="h-[52px] w-full rounded-full bg-gradient-to-r from-[#6D5DF5] to-[#4F46E5] font-semibold text-white shadow-fab transition active:scale-[0.99]"
      >
        View full breakdown
      </button>
      <button
        type="button"
        onClick={onDone}
        className="h-11 w-full font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim transition hover:text-ink"
      >
        {rating === null ? 'Skip for now' : 'Done'}
      </button>
    </motion.main>
  );
}

function BreakdownView({
  model,
  onBack,
  onTrends,
}: {
  model: MorningModel;
  onBack: () => void;
  onTrends: () => void;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      <CurveCard model={model} />

      <div className="grid grid-cols-4 overflow-hidden rounded-[20px] border border-line bg-bg-card/80">
        <TimelineTile icon={FlaskConical} time={model.firstDrinkAt} label="First drink" />
        <TimelineTile icon={Droplet} time={model.peakAt} label={`Peak ${formatBac(model.peakBac)}`} />
        <TimelineTile icon={FlaskConical} time={model.lastDrinkAt} label="Last drink" />
        <TimelineTile icon={Moon} time={model.wokeAt} label="Woke up" />
      </div>

      <CardShell title="How you did" subtitle="vs your plan">
        <CheckRow
          icon={FlaskConical}
          label="Drinks"
          value={
            model.plannedDrinks
              ? `${model.loggedDrinks} of ${model.plannedDrinks}`
              : `${model.loggedDrinks} logged`
          }
          score={model.planScore}
        />
        <CheckRow icon={Gauge} label="Pace" value={model.paceLabel} score={model.paceScore} />
        <CheckRow
          icon={Droplet}
          label="Hydration"
          value={`${model.hydrationLabel}`}
          score={model.hydrationScore}
        />
        <CheckRow icon={Utensils} label="Food" value={model.foodLabel} score={model.foodScore} />
        <CheckRow icon={Clock3} label="Stop time" value={model.stopTimeLabel} score={model.planScore} />
      </CardShell>

      <CardShell title="What helped most" subtitle="Impact on your night">
        <div className="space-y-3">
          {model.helped.map((item) => (
            <ImpactBar key={item.label} item={item} />
          ))}
        </div>
      </CardShell>

      <CardShell title="What to improve" subtitle="Small changes, big difference">
        <div className="space-y-2">
          {model.improvements.map((item) => (
            <ActionRow key={item.title} item={item} />
          ))}
        </div>
      </CardShell>

      <CardShell title="Tomorrow's outlook" subtitle="Plan smarter, feel better.">
        <div className="grid grid-cols-2 gap-2">
          <SmallStatus
            icon={ShieldCheck}
            label="Hangover risk"
            value={model.tomorrowRiskLabel}
            sub="Based on last night"
          />
          <SmallStatus
            icon={Droplet}
            label="Readiness to drink"
            value={model.readinessLabel}
            sub="Check in again first"
          />
        </div>
        <button
          type="button"
          onClick={onTrends}
          className="mt-4 h-[50px] w-full rounded-full bg-gradient-to-r from-[#6D5DF5] to-[#4F46E5] font-semibold text-white transition active:scale-[0.99]"
        >
          View weekly trend
        </button>
      </CardShell>

      <button
        type="button"
        onClick={onBack}
        className="h-11 w-full font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim transition hover:text-ink"
      >
        Back to overview
      </button>
    </motion.main>
  );
}

function TrendsView({
  model,
  trend,
  note,
  onNote,
  onBack,
  onSubmit,
  canSubmit,
  onSkip,
}: {
  model: MorningModel;
  trend: TrendModel;
  note: string;
  onNote: (note: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  onSkip: () => void;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-4"
    >
      <CardShell title="Weekly trend" subtitle="Your last 7 days">
        <WeeklyTrend trend={trend} />
        <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-[18px] bg-[#0B1627] p-4">
          <TrendStat label="Avg. score" value={trend.avgScore ? `${trend.avgScore}` : '-'} />
          <TrendStat label="Best night" value={trend.bestScore ? `${trend.bestScore}` : '-'} sub={trend.bestLabel} />
          <TrendStat label="Things improving" value={trend.improving ? 'Yes' : 'Soon'} tone="green" />
        </div>
      </CardShell>

      <CardShell title="Insights over time">
        <div className="space-y-3">
          <TrendInsight
            icon={BarChart3}
            title={
              trend.improving
                ? 'Your average score is up this week.'
                : 'Your average score is settling in.'
            }
            body="You are making better choices more consistently."
          />
          <TrendInsight
            icon={Gauge}
            title="You are pacing better"
            body="Fewer sharp spikes, better control."
          />
          <TrendInsight
            icon={Sparkles}
            title="Recovery is improving"
            body="You are waking up feeling better overall."
          />
        </div>
      </CardShell>

      <CardShell title="Badge earned">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[#9B7CFF] shadow-fab">
            <ShieldCheck className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <div>
            <div className="font-display text-[25px] leading-none text-ink">On Track</div>
            <p className="mt-2 text-[14px] leading-snug text-ink-muted">
              3 nights in a row staying in control.
            </p>
          </div>
        </div>
      </CardShell>

      <CardShell title="Your notes" subtitle="Private notes from you">
        <div className="relative">
          <textarea
            value={note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="What helped? What would you change?"
            rows={3}
            className="w-full resize-none rounded-[18px] border border-line bg-[#0B1627] px-4 py-3 pr-10 text-[14px] text-ink placeholder:text-ink-dim focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
          <Edit3 className="absolute right-3 top-3 h-4 w-4 text-ink-dim" strokeWidth={1.7} />
        </div>
      </CardShell>

      <CardShell title="One small win">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">
            <Star className="h-6 w-6" fill="currentColor" strokeWidth={1.6} />
          </div>
          <div>
            <div className="font-display text-[23px] leading-none text-ink">{model.topWinTitle}</div>
            <p className="mt-2 text-[14px] leading-snug text-ink-muted">{model.topWinBody}</p>
          </div>
        </div>
      </CardShell>

      <CardShell title="Reminders" subtitle="Stay on track">
        <ReminderRow icon={FlaskConical} label="Drink water between each drink" />
        <ReminderRow icon={Utensils} label="Eat something before your 2nd drink" />
        <ReminderRow icon={Clock3} label="Do not forget your morning recap" />
      </CardShell>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="h-[52px] w-full rounded-full bg-gradient-to-r from-[#6D5DF5] to-[#4F46E5] font-semibold text-white shadow-fab transition active:scale-[0.99] disabled:opacity-40 disabled:shadow-none"
      >
        Finish recap
      </button>
      <button
        type="button"
        onClick={canSubmit ? onBack : onSkip}
        className="h-11 w-full font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim transition hover:text-ink"
      >
        {canSubmit ? 'Back to breakdown' : 'Skip for now'}
      </button>
    </motion.main>
  );
}

function CardShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-line bg-bg-card/80 p-4 shadow-card backdrop-blur">
      <div className="mb-4">
        <div className="eyebrow">{title}</div>
        {subtitle && <div className="mt-1 text-[13px] text-ink-muted">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#8B5CF6 ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-bg-card">
        <div className="font-display text-[38px] leading-none text-ink">{score}</div>
        <div className="font-mono text-[10px] text-ink-muted">/100</div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'green' | 'yellow';
}) {
  return (
    <div className="rounded-[14px] bg-[#0B1627] p-3">
      <div className="font-mono text-[9px] text-ink-dim">{label}</div>
      <div className="mt-2 font-display text-[26px] leading-none text-ink">{value}</div>
      <div
        className={`mt-1 text-[12px] ${
          tone === 'green'
            ? 'text-risk-green'
            : tone === 'yellow'
              ? 'text-risk-yellow'
              : 'text-ink-muted'
        }`}
      >
        {sub}
      </div>
    </div>
  );
}

function InsightRow({ item }: { item: InsightItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-line bg-[#0B1627] p-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-snug text-ink">{item.title}</div>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{item.body}</p>
      </div>
      <CheckCircle2
        className={`h-5 w-5 shrink-0 ${
          item.status === 'good' ? 'text-risk-green' : 'text-risk-yellow'
        }`}
        strokeWidth={1.8}
      />
    </div>
  );
}

function Progress({
  value,
  tone,
  className,
}: {
  value: number;
  tone: 'green' | 'indigo' | 'yellow';
  className?: string;
}) {
  const color =
    tone === 'green' ? 'bg-risk-green' : tone === 'yellow' ? 'bg-risk-yellow' : 'bg-accent';
  return (
    <div className={`h-2 rounded-full bg-white/10 ${className ?? ''}`}>
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
    </div>
  );
}

function SmallStatus({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-[16px] border border-line bg-[#0B1627] p-3">
      <div className="flex items-center gap-2 text-ink-muted">
        <Icon className="h-4 w-4" strokeWidth={1.7} />
        <span className="text-[12px]">{label}</span>
      </div>
      <div className="mt-2 font-display text-[22px] leading-none text-ink">{value}</div>
      <div className="mt-1 text-[12px] leading-snug text-ink-muted">{sub}</div>
    </div>
  );
}

function CurveCard({ model }: { model: MorningModel }) {
  const points = curvePolyline(model.curve);
  const peakX = peakPosition(model.curve, model.peakAt);
  return (
    <CardShell title="Night timeline">
      <div className="relative h-[178px] rounded-[18px] bg-[#0B1627] p-3">
        <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          BAC
        </div>
        <svg viewBox="0 0 300 130" className="mt-5 h-[130px] w-full overflow-visible">
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1="12"
              x2="292"
              y1={20 + line * 30}
              y2={20 + line * 30}
              stroke="rgba(255,255,255,0.06)"
            />
          ))}
          <line x1="12" x2="292" y1="110" y2="110" stroke="rgba(255,255,255,0.12)" />
          <line
            x1="12"
            x2="292"
            y1="60"
            y2="60"
            stroke="rgba(159,176,195,0.55)"
            strokeDasharray="6 5"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {model.peakAt && (
            <>
              <line
                x1={peakX}
                x2={peakX}
                y1="20"
                y2="112"
                stroke="rgba(139,92,246,0.5)"
                strokeDasharray="4 4"
              />
              <circle cx={peakX} cy={peakY(model.curve)} r="5" fill="#E6EDF5" />
            </>
          )}
        </svg>
        <div className="absolute bottom-3 left-5 right-5 flex justify-between font-mono text-[10px] text-ink-dim">
          <span>{formatTime(model.curve[0]?.at ?? model.firstDrinkAt)}</span>
          <span>{formatTime(model.peakAt)}</span>
          <span>{formatTime(model.curve[model.curve.length - 1]?.at ?? model.wokeAt)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-5 text-[12px] text-ink-muted">
        <LegendDot color="#8B5CF6" label="BAC" />
        <LegendLine label="Est. limit" />
      </div>
    </CardShell>
  );
}

function TimelineTile({
  icon: Icon,
  time,
  label,
}: {
  icon: LucideIcon;
  time: number | null;
  label: string;
}) {
  return (
    <div className="border-r border-line p-3 text-center last:border-r-0">
      <Icon className="mx-auto h-4 w-4 text-ink-muted" strokeWidth={1.6} />
      <div className="mt-2 font-mono text-[10px] text-ink-muted">{formatTime(time)}</div>
      <div className="mt-1 text-[12px] leading-snug text-ink">{label}</div>
    </div>
  );
}

function CheckRow({
  icon: Icon,
  label,
  value,
  score,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  score: number;
}) {
  const good = score >= 70;
  return (
    <div className="flex items-center border-b border-line py-3 last:border-b-0">
      <Icon className="mr-3 h-5 w-5 text-ink-muted" strokeWidth={1.7} />
      <div className="flex-1 text-[15px] text-ink">{label}</div>
      <div className="mr-3 text-[14px] text-ink-muted">{value}</div>
      <CheckCircle2
        className={`h-5 w-5 ${good ? 'text-risk-green' : 'text-risk-yellow'}`}
        fill="currentColor"
        strokeWidth={1.8}
      />
    </div>
  );
}

function ImpactBar({ item }: { item: BarItem }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px] text-ink-muted">
        <span>{item.label}</span>
        <span>{item.impact}</span>
      </div>
      <Progress value={item.value} tone="indigo" />
    </div>
  );
}

function ActionRow({ item }: { item: InsightItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-[#0B1627] p-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.tone}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-snug text-ink">{item.title}</div>
        <p className="text-[13px] leading-snug text-ink-muted">{item.body}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-dim" />
    </div>
  );
}

function WeeklyTrend({ trend }: { trend: TrendModel }) {
  const maxBac = Math.max(0.08, ...trend.points.map((point) => point.peakBac ?? 0));
  return (
    <div className="rounded-[18px] bg-[#0B1627] p-4">
      <div className="flex h-[122px] items-end gap-3 border-b border-line pb-2">
        {trend.points.map((point) => {
          const scoreHeight = point.score ? Math.max(18, (point.score / 100) * 100) : 10;
          const bacTop = point.peakBac ? 100 - (point.peakBac / maxBac) * 80 : 92;
          return (
            <div key={point.label} className="relative flex flex-1 flex-col items-center">
              <div
                className={`w-full rounded-t-[6px] ${
                  point.active ? 'bg-[#8B5CF6]/80' : 'bg-[#5866A6]/55'
                }`}
                style={{ height: `${scoreHeight}px` }}
              />
              <div
                className="absolute h-2 w-2 rounded-full bg-ink"
                style={{ top: `${bacTop}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-7 text-center font-mono text-[10px] text-ink-dim">
        {trend.points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-5 text-[12px] text-ink-muted">
        <LegendDot color="#8B5CF6" label="Score" />
        <LegendDot color="#E6EDF5" label="Peak BAC" />
      </div>
    </div>
  );
}

function TrendStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'green';
}) {
  return (
    <div className="px-2 first:pl-0 last:pr-0">
      <div className="text-[11px] text-ink-muted">{label}</div>
      <div className={`mt-1 font-display text-[27px] leading-none ${tone === 'green' ? 'text-risk-green' : 'text-ink'}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-ink-dim">{sub}</div>}
    </div>
  );
}

function TrendInsight({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-[#0B1627] text-[#8B5CF6]">
        <Icon className="h-6 w-6" strokeWidth={1.7} />
      </div>
      <div>
        <div className="text-[15px] font-semibold leading-snug text-ink">{title}</div>
        <p className="mt-1 text-[13px] leading-snug text-ink-muted">{body}</p>
      </div>
    </div>
  );
}

function ReminderRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
      <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.7} />
      <span className="flex-1 text-[14px] text-ink-muted">{label}</span>
      <CheckCircle2 className="h-5 w-5 text-risk-green" fill="currentColor" strokeWidth={1.8} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function LegendLine({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-px w-6 border-t border-dashed border-ink-muted" />
      {label}
    </span>
  );
}

function buildMorningModel(profile: Profile, session: Session): MorningModel {
  const endedAt = session.endedAt ?? Date.now();
  const firstDrinkAt = firstAt(session.drinks);
  const lastDrinkAt = lastAt(session.drinks);
  const plannedStart = session.plannedStartMs ?? session.startedAt;
  const nightStart = Math.min(plannedStart, firstDrinkAt ?? session.startedAt);
  const wokeAt = Math.max(session.wakeAtMs ?? endedAt + 8 * HOUR_MS, endedAt);
  const searchEnd = Math.max(endedAt, (lastDrinkAt ?? endedAt) + 90 * MINUTE_MS);
  const peak = findPeak(profile, session.drinks, session.food, nightStart, searchEnd);
  const peakBac = Math.max(session.peakBac ?? 0, peak.bac);
  const peakAt = session.peakBacAt ?? peak.at;
  const endBac = computeBacAt({ profile, drinks: session.drinks, food: session.food, at: wokeAt }, BETA_TYPICAL);
  const underLimitAt =
    session.estimatedUnderLimitAt ??
    safeToDriveAt({ profile, drinks: session.drinks, food: session.food, at: endedAt }, 0.05);
  const soberAt =
    session.estimatedSoberAt ??
    projectedSoberAt({ profile, drinks: session.drinks, food: session.food, at: endedAt }, 0);
  const scores = scoreSession(session, peakBac);
  const recoveryScore = recoveryScoreFor(endBac, scores.hydrationScore);
  const firstName = profile.name.trim().split(/\s+/)[0] || 'there';
  const curveTo = Math.max(wokeAt, searchEnd + 2 * HOUR_MS);
  const curve = bacCurve(profile, session.drinks, session.food, nightStart, curveTo, 72);
  const keyInsights = buildKeyInsights(scores, underLimitAt, wokeAt);
  const top = topWinFor(session, scores);
  const planStop = session.plannedStartMs
    ? session.plannedStartMs + session.expectedHours * HOUR_MS
    : session.startedAt + session.expectedHours * HOUR_MS;

  return {
    ...scores,
    dateLabel: new Date(session.startedAt).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
    firstName,
    scoreTitle: scoreTitle(scores.nightScore),
    scoreBody: scoreBody(scores.nightScore),
    plannedDrinks: session.plannedDrinkCap ?? null,
    loggedDrinks: session.drinks.length,
    totalStd: totalStandardDrinks(session),
    peakBac,
    peakAt,
    endBac,
    underLimitAt,
    soberAt,
    firstDrinkAt,
    lastDrinkAt,
    wokeAt,
    stopTimeLabel: endedAt <= planStop + 20 * MINUTE_MS ? formatTime(endedAt) : 'Late finish',
    paceLabel: paceLabel(session.drinks),
    hydrationLabel: hydrationLabel(scores.hydrationScore),
    foodLabel: foodLabel(session.food),
    recoveryScore,
    driveSafeLabel: driveSafeLabel(underLimitAt, wokeAt),
    driveSafeDetail: driveSafeDetail(underLimitAt, wokeAt),
    tomorrowRiskLabel: peakBac >= 0.08 ? 'Moderate' : 'Low',
    readinessLabel: recoveryScore >= 70 ? 'Good' : 'Recover',
    topWinTitle: top.title,
    topWinBody: top.body,
    keyInsights,
    helped: buildHelped(session, scores),
    improvements: buildImprovements(session, scores),
    curve,
  };
}

function scoreSession(session: Session, peakBac: number): ScoreBreakdown {
  const planned = session.plannedDrinkCap;
  const logged = session.drinks.length;
  const planScore =
    typeof planned === 'number'
      ? clamp(100 - Math.max(0, logged - planned) * 25, 20, 100)
      : 82;
  const paceScore = paceScoreFor(session.drinks);
  const targetWater = Math.max(1, logged - 1);
  const hydrationScore =
    logged === 0 ? 100 : clamp((session.water.length / targetWater) * 100, 35, 100);
  const foodScore = foodScoreFor(session.food, logged);
  const bacSafetyScore = bacSafetyScoreFor(peakBac);
  const nightScore = Math.round(
    planScore * 0.3 +
      paceScore * 0.2 +
      hydrationScore * 0.2 +
      foodScore * 0.1 +
      bacSafetyScore * 0.2,
  );
  return {
    nightScore,
    planScore,
    paceScore,
    hydrationScore,
    foodScore,
    bacSafetyScore,
  };
}

function buildTrendModel(profile: Profile, history: Session[], currentId: string): TrendModel {
  const now = Date.now();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now - (6 - index) * 24 * HOUR_MS);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const sessions = endedSessions(history);
  const points = days.map((day) => {
    const start = day.getTime();
    const end = start + 24 * HOUR_MS;
    const matching = sessions.filter((session) => {
      const marker = session.wakeAtMs ?? session.endedAt ?? session.startedAt;
      return marker >= start && marker < end;
    });
    if (matching.length === 0) {
      return {
        label: day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
        score: null,
        peakBac: null,
        active: false,
      };
    }
    const scores = matching.map((session) => scoreForTrend(profile, session));
    const peaks = matching.map((session) => peakForTrend(profile, session));
    return {
      label: day.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
      score: Math.round(avg(scores)),
      peakBac: Math.max(...peaks),
      active: matching.some((session) => session.id === currentId),
    };
  });
  const scores = points.flatMap((point) => (point.score === null ? [] : [point.score]));
  const avgScore = scores.length ? Math.round(avg(scores)) : null;
  const best = points.reduce<TrendPoint | null>((bestPoint, point) => {
    if (point.score === null) return bestPoint;
    if (!bestPoint || (bestPoint.score ?? 0) < point.score) return point;
    return bestPoint;
  }, null);
  const recent = scores.slice(-3);
  const prior = scores.slice(-6, -3);
  return {
    points,
    avgScore,
    bestScore: best?.score ?? null,
    bestLabel: best?.label ?? '-',
    improving: prior.length > 0 ? avg(recent) >= avg(prior) : scores.length > 0,
  };
}

function scoreForTrend(profile: Profile, session: Session): number {
  if (session.recap?.nightScore) return session.recap.nightScore;
  if (session.recap?.rating) return session.recap.rating * 20;
  return scoreSession(session, peakForTrend(profile, session)).nightScore;
}

function peakForTrend(profile: Profile, session: Session): number {
  if (typeof session.peakBac === 'number') return session.peakBac;
  const first = firstAt(session.drinks) ?? session.startedAt;
  const end = Math.max(session.endedAt ?? Date.now(), (lastAt(session.drinks) ?? Date.now()) + 90 * MINUTE_MS);
  return findPeak(profile, session.drinks, session.food, first, end).bac;
}

function buildKeyInsights(
  scores: ScoreBreakdown,
  underLimitAt: number | null,
  wokeAt: number,
): InsightItem[] {
  const insights: InsightItem[] = [];
  insights.push(
    scores.hydrationScore >= 80
      ? {
          title: 'Hydration was a win',
          body: 'Great job hitting your water target.',
          icon: Droplet,
          tone: 'bg-sky/15 text-sky',
          status: 'good',
        }
      : {
          title: 'More water earlier',
          body: 'Front-load water in the first 2 hours.',
          icon: Droplet,
          tone: 'bg-sky/15 text-sky',
          status: 'watch',
        },
  );
  insights.push(
    scores.paceScore >= 75
      ? {
          title: 'Pace improved',
          body: 'You slowed down after the first stretch.',
          icon: Gauge,
          tone: 'bg-risk-green/15 text-risk-green',
          status: 'good',
        }
      : {
          title: 'Pace got quick',
          body: 'Leave more space between rounds next time.',
          icon: Gauge,
          tone: 'bg-risk-yellow/15 text-risk-yellow',
          status: 'watch',
        },
  );
  insights.push({
    title: underLimitAt && underLimitAt > wokeAt ? 'Driving needs more time' : 'Safe range by morning',
    body:
      underLimitAt && underLimitAt > wokeAt
        ? `Expected below 0.05 by ${formatTime(underLimitAt)}.`
        : 'Your estimate was under 0.05 by wake-up.',
    icon: Car,
    tone: underLimitAt && underLimitAt > wokeAt ? 'bg-risk-yellow/15 text-risk-yellow' : 'bg-risk-green/15 text-risk-green',
    status: underLimitAt && underLimitAt > wokeAt ? 'watch' : 'good',
  });
  insights.push(
    scores.foodScore >= 80
      ? {
          title: 'Food helped',
          body: 'A meal softened the absorption curve.',
          icon: Utensils,
          tone: 'bg-risk-green/15 text-risk-green',
          status: 'good',
        }
      : {
          title: 'Food could help',
          body: 'A meal earlier in the night would have helped more.',
          icon: Utensils,
          tone: 'bg-risk-yellow/15 text-risk-yellow',
          status: 'watch',
        },
  );
  return insights;
}

function buildHelped(session: Session, scores: ScoreBreakdown): BarItem[] {
  const items: BarItem[] = [
    { label: 'Water intake', value: scores.hydrationScore, impact: 'High impact' },
    { label: 'Stopped on time', value: scores.planScore, impact: 'High impact' },
    { label: 'Slower pace', value: scores.paceScore, impact: 'Medium impact' },
    { label: session.food.some((entry) => entry.size === 'meal') ? 'Had a meal' : 'Food timing', value: scores.foodScore, impact: 'Medium impact' },
  ];
  return items.sort((a, b) => b.value - a.value);
}

function buildImprovements(session: Session, scores: ScoreBreakdown): InsightItem[] {
  const items: InsightItem[] = [];
  if (scores.foodScore < 80) {
    items.push({
      title: 'Eat earlier',
      body: 'Having a meal before drinking helps more.',
      icon: Utensils,
      tone: 'bg-risk-yellow/15 text-risk-yellow',
      status: 'watch',
    });
  }
  if (scores.hydrationScore < 90) {
    items.push({
      title: 'More water earlier',
      body: 'Front-load your water in the first 2 hours.',
      icon: Droplet,
      tone: 'bg-sky/15 text-sky',
      status: 'watch',
    });
  }
  if (scores.paceScore < 80) {
    items.push({
      title: 'Slightly slower start',
      body: `You had ${Math.min(2, session.drinks.length)} drinks in the first hour.`,
      icon: Gauge,
      tone: 'bg-risk-red/15 text-risk-red',
      status: 'watch',
    });
  }
  if (items.length === 0) {
    items.push({
      title: 'Repeat this pattern',
      body: 'Same cap, water between rounds, stop on time.',
      icon: Sparkles,
      tone: 'bg-accent/15 text-[#9B7CFF]',
      status: 'good',
    });
  }
  return items.slice(0, 3);
}

function topWinFor(session: Session, scores: ScoreBreakdown): { title: string; body: string } {
  const options = [
    {
      score: scores.hydrationScore,
      title: 'Great call on the water',
      body: 'It made a real difference last night.',
    },
    {
      score: scores.planScore,
      title: 'You chose balance',
      body: 'You planned well and stuck to it.',
    },
    {
      score: scores.foodScore,
      title: 'Food did its job',
      body: 'Eating helped keep the curve steadier.',
    },
    {
      score: scores.paceScore,
      title: 'Good pace control',
      body: 'Spacing things out kept the night calmer.',
    },
  ];
  if (session.autoEnded) {
    options.push({
      score: 88,
      title: 'Session closed cleanly',
      body: 'No activity for 2 hours, so the app wrapped the night.',
    });
  }
  return options.sort((a, b) => b.score - a.score)[0];
}

function findPeak(
  profile: Profile,
  drinks: DrinkEntry[],
  food: FoodEntry[],
  fromMs: number,
  toMs: number,
): { bac: number; at: number | null } {
  if (drinks.length === 0) return { bac: 0, at: null };
  let peak = 0;
  let peakAt: number | null = fromMs;
  for (let t = fromMs; t <= toMs; t += 5 * MINUTE_MS) {
    const bac = computeBacAt({ profile, drinks, food, at: t }, BETA_TYPICAL);
    if (bac >= peak) {
      peak = bac;
      peakAt = t;
    }
  }
  return { bac: peak, at: peakAt };
}

function firstAt(items: { at: number }[]): number | null {
  if (items.length === 0) return null;
  return Math.min(...items.map((item) => item.at));
}

function lastAt(items: { at: number }[]): number | null {
  if (items.length === 0) return null;
  return Math.max(...items.map((item) => item.at));
}

function totalStandardDrinks(session: Session): number {
  return session.drinks.reduce((sum, drink) => sum + drink.standardDrinks, 0);
}

function paceScoreFor(drinks: DrinkEntry[]): number {
  if (drinks.length < 2) return 100;
  const sorted = [...drinks].sort((a, b) => a.at - b.at);
  const gaps = sorted.slice(1).map((drink, index) => (drink.at - sorted[index].at) / MINUTE_MS);
  const averageGap = avg(gaps);
  if (averageGap >= 50) return 100;
  if (averageGap >= 40) return 88;
  if (averageGap >= 30) return 74;
  if (averageGap >= 20) return 55;
  return 35;
}

function foodScoreFor(food: FoodEntry[], drinkCount: number): number {
  if (drinkCount === 0) return 100;
  if (food.some((entry) => entry.size === 'meal')) return 100;
  if (food.some((entry) => entry.size === 'snack')) return 72;
  return 38;
}

function bacSafetyScoreFor(peakBac: number): number {
  if (peakBac <= 0.05) return 100;
  if (peakBac <= 0.07) return 78;
  if (peakBac <= 0.09) return 58;
  if (peakBac <= 0.11) return 38;
  return 18;
}

function recoveryScoreFor(endBac: number, hydrationScore: number): number {
  const bacPenalty = clamp(endBac / 0.05, 0, 1) * 45;
  const hydrationBonus = (hydrationScore - 50) * 0.25;
  return Math.round(clamp(72 - bacPenalty + hydrationBonus, 20, 96));
}

function scoreTitle(score: number): string {
  if (score >= 82) return 'Great night';
  if (score >= 68) return 'Good night';
  if (score >= 52) return 'Mixed night';
  return 'Rough night';
}

function scoreBody(score: number): string {
  if (score >= 82) return 'You made strong choices.';
  if (score >= 68) return 'You made some great choices.';
  if (score >= 52) return 'A few choices pushed the morning.';
  return 'Recovery needs more room today.';
}

function hydrationLabel(score: number): string {
  if (score >= 90) return 'Good';
  if (score >= 65) return 'Okay';
  return 'Low';
}

function foodLabel(food: FoodEntry[]): string {
  if (food.some((entry) => entry.size === 'meal')) return '1 meal';
  if (food.some((entry) => entry.size === 'snack')) return 'Snack';
  return 'None';
}

function paceLabel(drinks: DrinkEntry[]): string {
  const score = paceScoreFor(drinks);
  if (score >= 85) return 'Good';
  if (score >= 65) return 'Okay';
  return 'Fast';
}

function driveSafeLabel(underLimitAt: number | null, wokeAt: number): string {
  if (!underLimitAt || underLimitAt <= wokeAt) return 'Now';
  return `~${durationHours(wokeAt, underLimitAt)}`;
}

function driveSafeDetail(underLimitAt: number | null, wokeAt: number): string {
  if (!underLimitAt || underLimitAt <= wokeAt) return 'Under 0.05 estimate';
  return `at ${formatTime(underLimitAt)}`;
}

function curvePolyline(samples: BacSample[]): string {
  if (samples.length === 0) return '12,110 292,110';
  const max = Math.max(0.08, ...samples.map((sample) => sample.bac));
  return samples
    .map((sample, index) => {
      const x = 12 + (index / Math.max(1, samples.length - 1)) * 280;
      const y = 110 - (sample.bac / max) * 90;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function peakPosition(samples: BacSample[], peakAt: number | null): number {
  if (!peakAt || samples.length === 0) return 152;
  const first = samples[0].at;
  const last = samples[samples.length - 1].at;
  return 12 + (clamp((peakAt - first) / Math.max(1, last - first), 0, 1) * 280);
}

function peakY(samples: BacSample[]): number {
  if (samples.length === 0) return 110;
  const max = Math.max(0.08, ...samples.map((sample) => sample.bac));
  const peak = Math.max(...samples.map((sample) => sample.bac));
  return 110 - (peak / max) * 90;
}

function viewLabel(view: RecapView): string {
  if (view === 'breakdown') return 'Night timeline';
  if (view === 'trends') return 'Weekly trend';
  return 'Morning recap';
}

function formatBac(value: number): string {
  return value.toFixed(3);
}

function formatTime(value: number | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function durationHours(from: number, to: number): string {
  const hours = Math.max(0, (to - from) / HOUR_MS);
  if (hours < 1) return `${Math.round(hours * 60)} mins`;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} hrs`;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
