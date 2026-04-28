import { useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Car,
  Check,
  ChevronDown,
  Clock3,
  Droplets,
  LockKeyhole,
  Moon,
  Mountain,
  Route,
  Scale,
  ShieldCheck,
  Target,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { HeroStateArt } from '@/components/illustrations/EditorialArt';
import { buildBaselineModel } from '@/lib/baseline';
import { planNight } from '@/lib/plan';
import { formatClockWithDay } from '@/lib/time';
import type { Profile } from '@/types';

type Props = {
  profile: Profile;
  onStart: (
    h: number,
    opts?: {
      wakeAtMs?: number;
      planToDrive?: boolean;
      plannedStartMs?: number;
      plannedDrinkCap?: number;
    },
  ) => void;
};

type PlanOptionId = 'sharp' | 'balanced' | 'push';
type ActionKey = 'water' | 'meal' | 'stop';
type ActionState = Record<ActionKey, boolean>;

type PlanOption = {
  id: PlanOptionId;
  title: string;
  drinksLabel: string;
  summaryLabel: string;
  detail: string;
  cap: number;
  icon: LucideIcon;
  accent: string;
  recommended?: boolean;
};

type ActionRow = {
  key: ActionKey;
  label: string;
  subtext: string;
  summary: string;
  icon: LucideIcon;
  accent: string;
};

type SummaryItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  accent: string;
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'sharp',
    title: 'Stay sharp',
    drinksLabel: '2 drinks',
    summaryLabel: '2 drinks',
    detail: 'Max focus tomorrow',
    cap: 2,
    icon: Target,
    accent: '#8B5CF6',
  },
  {
    id: 'balanced',
    title: 'Balanced',
    drinksLabel: '3 drinks',
    summaryLabel: '3 drinks',
    detail: 'Steady night, clear morning',
    cap: 3,
    icon: Scale,
    accent: '#6366F1',
    recommended: true,
  },
  {
    id: 'push',
    title: 'Push it',
    drinksLabel: '4+ drinks',
    summaryLabel: '4 drinks',
    detail: 'More risk tomorrow',
    cap: 4,
    icon: Mountain,
    accent: '#F472B6',
  },
];

const ACTION_ROWS: ActionRow[] = [
  {
    key: 'water',
    label: 'Drink water between rounds',
    subtext: 'Keeps you clearer',
    summary: 'Water between rounds',
    icon: Droplets,
    accent: '#38BDF8',
  },
  {
    key: 'meal',
    label: 'Eat before first drink',
    subtext: 'More control, less impact',
    summary: 'Meal before first drink',
    icon: Utensils,
    accent: '#22C55E',
  },
  {
    key: 'stop',
    label: 'Stick to a stop time',
    subtext: 'Helps you stay in control',
    summary: 'Stop time set',
    icon: Clock3,
    accent: '#F97316',
  },
];

function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function PlanTonight({ profile, onStart }: Props) {
  const baselineModel = useMemo(
    () => buildBaselineModel(profile.baseline),
    [profile.baseline],
  );
  const [planBaseline] = useState(() => Date.now());
  const [selectedId, setSelectedId] = useState<PlanOptionId>('balanced');
  const [actions, setActions] = useState<ActionState>({
    water: true,
    meal: true,
    stop: true,
  });
  const [locked, setLocked] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [rideHome, setRideHome] = useState(false);
  const [driving, setDriving] = useState(false);
  const [hours, setHours] = useState(() => baselineModel?.expectedHours ?? 4);
  const [wakeDraft, setWakeDraft] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return toLocalInputValue(d.getTime());
  });
  const [useWake, setUseWake] = useState(true);
  const [startLater, setStartLater] = useState(false);
  const [startDraft, setStartDraft] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return toLocalInputValue(d.getTime());
  });

  const selected =
    PLAN_OPTIONS.find((option) => option.id === selectedId) ?? PLAN_OPTIONS[1];

  const plannedStartMs = useMemo(() => {
    if (!startLater) return undefined;
    const next = new Date(startDraft).getTime();
    return Number.isFinite(next) && next > Date.now() ? next : undefined;
  }, [startLater, startDraft]);

  const wakeMs = useMemo(() => {
    const next = new Date(wakeDraft).getTime();
    return Number.isFinite(next) ? next : undefined;
  }, [wakeDraft]);

  const plan = useMemo(
    () =>
      planNight({
        profile,
        plannedStartMs: plannedStartMs ?? planBaseline,
        expectedHours: hours,
        wakeAtMs: useWake ? wakeMs : undefined,
        driving,
      }),
    [profile, plannedStartMs, planBaseline, hours, useWake, wakeMs, driving],
  );

  const summaryItems = useMemo(
    () => buildSummaryItems(selected, actions, rideHome, driving),
    [selected, actions, rideHome, driving],
  );

  const canLock = !startLater || Boolean(plannedStartMs);
  const stopTimeMs = plan.lastCallMs ?? plan.plannedEndMs;
  const safetySummary = buildSafetySummary({
    rideHome,
    driving,
    plannedStartMs,
    useWake,
    wakeMs,
    stopTimeMs,
  });

  const startPlan = () => {
    onStart(hours, {
      wakeAtMs: useWake ? wakeMs : undefined,
      planToDrive: driving,
      plannedStartMs,
      plannedDrinkCap: selected.cap,
    });
  };

  return (
    <div className="max-w-[480px] mx-auto px-6 pt-6 pb-28">
      <AnimatePresence mode="wait">
        {locked ? (
          <LockedPlan
            key="locked"
            selected={selected}
            summaryItems={summaryItems}
            onStart={startPlan}
          />
        ) : (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DecisionHero selected={selected} />

            <section className="mt-4">
              <SectionLabel index="1" label="Choose your plan" />
              <div className="grid grid-cols-3 gap-2.5 mt-3">
                {PLAN_OPTIONS.map((option) => (
                  <PlanOptionCard
                    key={option.id}
                    option={option}
                    selected={selected.id === option.id}
                    onSelect={() => setSelectedId(option.id)}
                  />
                ))}
              </div>
            </section>

            <section className="mt-4">
              <SectionLabel index="2" label="Make this plan work" />
              <div className="space-y-3 mt-3">
                {ACTION_ROWS.map((row) => (
                  <ActionDecisionRow
                    key={row.key}
                    row={row}
                    active={actions[row.key]}
                    onToggle={() =>
                      setActions((current) => ({
                        ...current,
                        [row.key]: !current[row.key],
                      }))
                    }
                  />
                ))}
              </div>
            </section>

            <SafetyTiming
              open={safetyOpen}
              onToggleOpen={() => setSafetyOpen((open) => !open)}
              rideHome={rideHome}
              onToggleRideHome={() => {
                const next = !rideHome;
                setRideHome(next);
                if (next) setDriving(false);
              }}
              driving={driving}
              onSetDriving={(next) => {
                setDriving(next);
                if (next) setRideHome(false);
              }}
              hours={hours}
              onSetHours={setHours}
              startLater={startLater}
              onSetStartLater={setStartLater}
              startDraft={startDraft}
              onSetStartDraft={setStartDraft}
              plannedStartMs={plannedStartMs}
              useWake={useWake}
              onSetUseWake={setUseWake}
              wakeDraft={wakeDraft}
              onSetWakeDraft={setWakeDraft}
              summary={safetySummary}
              stopTimeMs={stopTimeMs}
            />

            <PlanSummary summaryItems={summaryItems} />

            <motion.button
              type="button"
              whileTap={canLock ? { scale: 1.025 } : undefined}
              disabled={!canLock}
              onClick={() => {
                if (canLock) setLocked(true);
              }}
              className="w-full mt-4 min-h-[58px] rounded-2xl bg-[linear-gradient(135deg,#6366F1_0%,#7C3AED_100%)] px-5 text-base font-semibold text-white shadow-[0_18px_42px_-16px_rgba(99,102,241,0.75),0_0_22px_rgba(99,102,241,0.22)] transition duration-150 active:brightness-110 disabled:opacity-45 disabled:shadow-none"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <LockKeyhole className="h-5 w-5" strokeWidth={2} />
                Lock in plan
              </span>
            </motion.button>

            <p className="font-mono text-[10px] text-ink-dim text-center mt-3">
              Estimates only. Never use this app to decide if you can drive.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DecisionHero({ selected }: { selected: PlanOption }) {
  const heroState = selected.id === 'push' ? 'high' : 'mid';
  return (
    <motion.header
      layout
      className="relative min-h-[306px] overflow-hidden rounded-[30px] border border-line bg-bg-card shadow-card-lg"
    >
      <div className="absolute inset-0">
        <HeroStateArt
          state={heroState}
          title="Night path through mountains"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.42)_45%,rgba(15,23,42,0.94)_100%)]" />
        <div className="absolute left-[17%] right-[10%] bottom-[26%] h-[3px] rotate-[-8deg] rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0),rgba(129,140,248,0.75),rgba(56,189,248,0.15))] blur-[1px]" />
        <div className="absolute left-[31%] right-[22%] bottom-[30%] h-[44px] rotate-[-8deg] rounded-full bg-accent/25 blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-[306px] flex-col justify-end p-5">
        <div className="font-mono text-[11px] uppercase text-accent">
          Tonight&apos;s plan
        </div>
        <motion.h1
          key={selected.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="font-display text-[42px] leading-[1.02] text-ink mt-2"
        >
          {heroLine(selected)}
        </motion.h1>
        <div className="mt-4 inline-flex items-center gap-2 text-[15px] text-ink-muted">
          <ShieldCheck className="h-[18px] w-[18px] text-ink" strokeWidth={1.8} />
          <span>This keeps tomorrow clear.</span>
        </div>
      </div>
    </motion.header>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="font-mono text-[11px] uppercase text-accent">
      {index}. {label}
    </div>
  );
}

function PlanOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: PlanOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      animate={{ scale: selected ? 1.02 : 1 }}
      whileTap={{ scale: selected ? 1.01 : 0.98 }}
      transition={{ duration: 0.15 }}
      className={`relative min-h-[152px] rounded-[20px] border p-3 text-center transition duration-150 ${
        selected
          ? 'border-accent bg-accent/10 shadow-[0_0_28px_rgba(99,102,241,0.34)]'
          : 'border-line bg-bg-card hover:border-line-2 hover:bg-bg-elev/70'
      }`}
      style={selected ? { boxShadow: '0 0 30px rgba(99, 102, 241, 0.34)' } : undefined}
      aria-pressed={selected}
    >
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-accent text-white shadow-[0_0_18px_rgba(99,102,241,0.75)]"
          >
            <Check className="h-4 w-4" strokeWidth={2.4} />
          </motion.span>
        )}
      </AnimatePresence>
      <div
        className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-bg/45"
        style={{ color: option.accent }}
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <div className="font-display text-[18px] leading-tight text-ink mt-3">
        {option.title}
      </div>
      {option.recommended && (
        <div className="mx-auto mt-2 inline-flex rounded-full bg-accent px-2 py-1 font-mono text-[8px] uppercase text-white">
          Recommended
        </div>
      )}
      <div
        className={`font-semibold ${option.recommended ? 'mt-2' : 'mt-3'}`}
        style={{ color: option.accent }}
      >
        {option.drinksLabel}
      </div>
      <p className="text-[12px] leading-snug text-ink-muted mt-2">
        {option.detail}
      </p>
    </motion.button>
  );
}

function ActionDecisionRow({
  row,
  active,
  onToggle,
}: {
  row: ActionRow;
  active: boolean;
  onToggle: () => void;
}) {
  const Icon = row.icon;
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
      className={`w-full rounded-[18px] border p-3 text-left transition duration-150 ${
        active
          ? 'border-line-2 bg-bg-card shadow-card'
          : 'border-line bg-bg-card/55 opacity-70'
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center gap-3">
        <motion.span
          key={`${row.key}-${active}`}
          initial={active ? { scale: 0.9 } : { scale: 1 }}
          animate={
            active
              ? {
                  scale: [0.95, 1.08, 1],
                  boxShadow: `0 0 22px ${row.accent}55`,
                }
              : { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
          }
          transition={{ duration: 0.28 }}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
            active ? 'bg-bg-elev border-line-2' : 'bg-bg/35 border-line'
          }`}
          style={{ color: active ? row.accent : '#6B7C93' }}
        >
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
        </motion.span>
        <div className="min-w-0 flex-1">
          <div className={`text-[16px] font-semibold leading-tight ${active ? 'text-ink' : 'text-ink-muted'}`}>
            {row.label}
          </div>
          <div className="text-[13px] leading-snug text-ink-muted mt-1">
            {row.subtext}
          </div>
        </div>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
            active
              ? 'border-accent bg-accent text-white shadow-[0_0_16px_rgba(99,102,241,0.48)]'
              : 'border-line bg-bg/50 text-transparent'
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={2.4} />
        </span>
      </div>
    </motion.button>
  );
}

function SafetyTiming({
  open,
  onToggleOpen,
  rideHome,
  onToggleRideHome,
  driving,
  onSetDriving,
  hours,
  onSetHours,
  startLater,
  onSetStartLater,
  startDraft,
  onSetStartDraft,
  plannedStartMs,
  useWake,
  onSetUseWake,
  wakeDraft,
  onSetWakeDraft,
  summary,
  stopTimeMs,
}: {
  open: boolean;
  onToggleOpen: () => void;
  rideHome: boolean;
  onToggleRideHome: () => void;
  driving: boolean;
  onSetDriving: (next: boolean) => void;
  hours: number;
  onSetHours: (next: number) => void;
  startLater: boolean;
  onSetStartLater: (next: boolean) => void;
  startDraft: string;
  onSetStartDraft: (next: string) => void;
  plannedStartMs?: number;
  useWake: boolean;
  onSetUseWake: (next: boolean) => void;
  wakeDraft: string;
  onSetWakeDraft: (next: string) => void;
  summary: string;
  stopTimeMs: number;
}) {
  return (
    <section className="mt-4">
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full rounded-[20px] border border-line bg-bg-card p-4 text-left shadow-card transition hover:bg-bg-elev/75"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-bg/45 text-ink-muted">
            <Car className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-semibold leading-tight text-ink">
              Safety &amp; timing
            </div>
            <div className="truncate text-[13px] leading-snug text-ink-muted mt-1">
              {summary}
            </div>
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            className="text-ink-muted"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 rounded-[20px] border border-line bg-bg-card p-3 shadow-card">
              <SafetyDecision
                active={rideHome}
                icon={Route}
                label="Ride home"
                detail="Keeps the 0.05 question simple"
                accent="#38BDF8"
                onToggle={onToggleRideHome}
              />

              <div className="rounded-[17px] border border-line bg-bg/35 p-3">
                <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <Car className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.8} />
                  Driving status
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <SegmentButton
                    active={!driving}
                    icon={<Moon className="h-4 w-4" />}
                    label="Not driving"
                    onClick={() => onSetDriving(false)}
                  />
                  <SegmentButton
                    active={driving}
                    danger={driving}
                    icon={<Car className="h-4 w-4" />}
                    label="Driving"
                    onClick={() => onSetDriving(true)}
                  />
                </div>
              </div>

              <div className="rounded-[17px] border border-line bg-bg/35 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <Clock3 className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.8} />
                    Detailed timing
                  </div>
                  <span className="font-mono text-[11px] text-accent">
                    Stop {formatClockWithDay(stopTimeMs, Date.now())}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[13px] text-ink-muted">
                    <span>Session length</span>
                    <span className="font-mono text-ink">{hours}h</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    value={hours}
                    onChange={(event) => onSetHours(parseFloat(event.target.value))}
                    className="w-full mt-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <SegmentButton
                    active={!startLater}
                    icon={<Zap className="h-4 w-4" />}
                    label="Start now"
                    onClick={() => onSetStartLater(false)}
                  />
                  <SegmentButton
                    active={startLater}
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Start later"
                    onClick={() => onSetStartLater(true)}
                  />
                </div>

                {startLater && (
                  <>
                    <input
                      type="datetime-local"
                      value={startDraft}
                      onChange={(event) => onSetStartDraft(event.target.value)}
                      className="w-full h-11 px-3 mt-3 rounded-xl bg-bg-card border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
                    />
                    {!plannedStartMs && (
                      <div className="text-[12px] leading-snug text-risk-red mt-2">
                        Pick a future start time.
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <SegmentButton
                    active={useWake}
                    icon={<Moon className="h-4 w-4" />}
                    label="Wake time"
                    onClick={() => onSetUseWake(true)}
                  />
                  <SegmentButton
                    active={!useWake}
                    icon={<Target className="h-4 w-4" />}
                    label="Skip wake"
                    onClick={() => onSetUseWake(false)}
                  />
                </div>

                {useWake && (
                  <input
                    type="datetime-local"
                    value={wakeDraft}
                    onChange={(event) => onSetWakeDraft(event.target.value)}
                    className="w-full h-11 px-3 mt-3 rounded-xl bg-bg-card border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20"
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SafetyDecision({
  active,
  icon: Icon,
  label,
  detail,
  accent,
  onToggle,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  detail: string;
  accent: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-[17px] border p-3 text-left transition ${
        active ? 'border-line-2 bg-bg-elev/70' : 'border-line bg-bg/35'
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-2xl bg-bg/45"
          style={{ color: active ? accent : '#6B7C93' }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-ink">{label}</div>
          <div className="text-[12px] text-ink-muted mt-0.5">{detail}</div>
        </div>
        <span
          className={`grid h-7 w-7 place-items-center rounded-full border ${
            active ? 'border-accent bg-accent text-white' : 'border-line text-transparent'
          }`}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
      </div>
    </button>
  );
}

function SegmentButton({
  active,
  danger = false,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-xl px-3 text-sm font-semibold transition ${
        active
          ? danger
            ? 'bg-risk-red text-white'
            : 'bg-accent text-white shadow-[0_0_18px_rgba(99,102,241,0.28)]'
          : 'border border-line bg-bg-card text-ink-muted'
      }`}
    >
      <span className="inline-flex items-center justify-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

function PlanSummary({ summaryItems }: { summaryItems: SummaryItem[] }) {
  return (
    <section className="mt-4 rounded-[22px] border border-line-2 bg-bg-card p-4 shadow-card-lg">
      <SectionLabel index="3" label="Your plan summary" />
      <div className="grid grid-cols-[86px,1fr] gap-4 mt-4 items-center">
        <div className="relative h-[86px]">
          <div className="absolute inset-0 rounded-full bg-accent/25 blur-2xl" />
          <div className="relative grid h-full w-full place-items-center rounded-[28px] border border-accent/35 bg-accent/15 text-accent shadow-[0_0_28px_rgba(99,102,241,0.32)]">
            <ShieldCheck className="h-12 w-12" strokeWidth={1.6} />
          </div>
        </div>
        <div>
          <h2 className="font-display text-[26px] leading-tight text-ink">Your night</h2>
          <SummaryList items={summaryItems} compact />
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-3 text-center font-semibold text-accent">
        You&apos;re set for a steady night.
      </div>
    </section>
  );
}

function LockedPlan({
  selected,
  summaryItems,
  onStart,
}: {
  selected: PlanOption;
  summaryItems: SummaryItem[];
  onStart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="min-h-[calc(100vh-176px)] flex items-center"
    >
      <section className="relative w-full overflow-hidden rounded-[30px] border border-line-2 bg-bg-card p-5 shadow-card-lg">
        <div className="absolute inset-x-0 top-0 h-[248px]">
          <HeroStateArt
            state={selected.id === 'push' ? 'high' : 'mid'}
            title="Locked night plan"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.76)_72%,#1E293B_100%)]" />
        </div>
        <div className="relative z-10 pt-16 text-center">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.24, delay: 0.08 }}
            className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-accent/35 bg-accent/20 text-white shadow-[0_0_44px_rgba(99,102,241,0.72)]"
          >
            <ShieldCheck className="h-16 w-16" strokeWidth={1.5} />
          </motion.div>
          <div className="mt-8 inline-flex items-center justify-center gap-2">
            <h1 className="font-display text-[36px] leading-none text-ink">
              Plan locked
            </h1>
            <LockKeyhole className="h-5 w-5 text-ink-muted" strokeWidth={1.8} />
          </div>
          <p className="mx-auto mt-3 max-w-[260px] text-[17px] leading-snug text-ink-muted">
            We&apos;ll help you stay on track.
          </p>

          <div className="mt-6 rounded-[20px] border border-line bg-bg/45 p-4 text-left">
            <SummaryList items={summaryItems} />
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 1.025 }}
            onClick={onStart}
            className="w-full mt-6 min-h-[56px] rounded-2xl bg-[linear-gradient(135deg,#6366F1_0%,#7C3AED_100%)] px-5 text-base font-semibold text-white shadow-[0_18px_42px_-16px_rgba(99,102,241,0.75),0_0_22px_rgba(99,102,241,0.22)] transition active:brightness-110"
          >
            Start my night
          </motion.button>
        </div>
      </section>
    </motion.div>
  );
}

function SummaryList({
  items,
  compact = false,
}: {
  items: SummaryItem[];
  compact?: boolean;
}) {
  return (
    <ul className={compact ? 'space-y-2 mt-3' : 'space-y-3'}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.key} className="flex items-center gap-3 text-[15px] text-ink">
            <Icon
              className={compact ? 'h-[18px] w-[18px] shrink-0' : 'h-5 w-5 shrink-0'}
              strokeWidth={1.8}
              style={{ color: item.accent }}
            />
            <span>{item.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function heroLine(option: PlanOption): string {
  if (option.id === 'push') return 'Keep it to 4 drinks';
  return `Keep it to ${option.cap} drinks`;
}

function buildSummaryItems(
  selected: PlanOption,
  actions: ActionState,
  rideHome: boolean,
  driving: boolean,
): SummaryItem[] {
  const items: SummaryItem[] = [
    {
      key: 'drinks',
      label: selected.summaryLabel,
      icon: selected.icon,
      accent: '#6366F1',
    },
  ];

  for (const row of ACTION_ROWS) {
    if (!actions[row.key]) continue;
    items.push({
      key: row.key,
      label: row.summary,
      icon: row.icon,
      accent: row.accent,
    });
  }

  if (rideHome) {
    items.push({
      key: 'ride',
      label: 'Ride home planned',
      icon: Route,
      accent: '#38BDF8',
    });
  }

  if (driving) {
    items.push({
      key: 'driving',
      label: 'Driving status set',
      icon: Car,
      accent: '#F59E0B',
    });
  }

  return items;
}

function buildSafetySummary({
  rideHome,
  driving,
  plannedStartMs,
  useWake,
  wakeMs,
  stopTimeMs,
}: {
  rideHome: boolean;
  driving: boolean;
  plannedStartMs?: number;
  useWake: boolean;
  wakeMs?: number;
  stopTimeMs: number;
}) {
  const parts = [
    rideHome ? 'Ride home planned' : 'Ride home optional',
    driving ? 'driving status on' : 'not driving',
  ];

  if (plannedStartMs) {
    parts.push(`start ${formatClockWithDay(plannedStartMs, Date.now())}`);
  }

  parts.push(`stop ${formatClockWithDay(stopTimeMs, Date.now())}`);

  if (useWake && wakeMs) {
    parts.push(`wake ${formatClockWithDay(wakeMs, Date.now())}`);
  }

  return parts.join(' - ');
}
