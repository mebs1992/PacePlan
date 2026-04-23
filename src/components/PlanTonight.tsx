import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Car,
  ChevronDown,
  ChevronUp,
  Clock3,
  Droplets,
  Moon,
  Sparkles,
  Target,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassStillLifeArt } from '@/components/illustrations/EditorialArt';
import { buildBaselineModel, personalizedEasyMorningLine } from '@/lib/baseline';
import { buildDrinkTargetOptions, planNight } from '@/lib/plan';
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

type HabitKey = 'water' | 'meal' | 'stop' | 'ride';

type HabitToggle = {
  key: HabitKey;
  label: string;
  icon: LucideIcon;
};

const HABIT_ROWS: HabitToggle[] = [
  { key: 'water', label: 'Water between rounds', icon: Droplets },
  { key: 'meal', label: 'Eat before first drink', icon: Utensils },
  { key: 'stop', label: 'Stick to a stop time', icon: Clock3 },
  { key: 'ride', label: 'Book a ride home', icon: Car },
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
  const [hours, setHours] = useState(() => baselineModel?.expectedHours ?? 4);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [wakeDraft, setWakeDraft] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return toLocalInputValue(d.getTime());
  });
  const [useWake, setUseWake] = useState(true);
  const [driving, setDriving] = useState(false);
  const [startLater, setStartLater] = useState(false);
  const [startDraft, setStartDraft] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return toLocalInputValue(d.getTime());
  });
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(0);
  const [habits, setHabits] = useState<Record<HabitKey, boolean>>({
    water: true,
    meal: true,
    stop: true,
    ride: false,
  });

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

  const suggestedDrinkCap = useMemo(
    () =>
      personalizedEasyMorningLine(
        profile.baseline,
        plan.drinksCap,
        baselineModel?.readinessScore ?? null,
      ),
    [profile.baseline, plan.drinksCap, baselineModel?.readinessScore],
  );

  const targetOptions = useMemo(
    () => buildDrinkTargetOptions(suggestedDrinkCap, plan.drinksCap),
    [suggestedDrinkCap, plan.drinksCap],
  );

  useEffect(() => {
    setHabits((current) => ({
      ...current,
      ride: driving ? true : current.ride,
      stop: plan.lastCallMs !== null ? current.stop : false,
    }));
  }, [driving, plan.lastCallMs]);

  useEffect(() => {
    if (!selectionTouched) {
      setSelectedTarget(suggestedDrinkCap);
      return;
    }

    if (!targetOptions.includes(selectedTarget)) {
      const fallback =
        [...targetOptions].reverse().find((value) => value <= selectedTarget) ??
        targetOptions[0] ??
        suggestedDrinkCap;
      setSelectedTarget(fallback);
    }
  }, [selectionTouched, selectedTarget, suggestedDrinkCap, targetOptions]);

  const firstName = profile.name.split(' ')[0] || profile.name;
  const today = new Date()
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();
  const advancedSummary = buildAdvancedSummary({
    hours,
    plannedStartMs,
    useWake,
    wakeMs,
    driving,
  });
  const prediction = buildPredictionCopy({
    selectedTarget,
    suggestedDrinkCap,
    plannerCap: plan.drinksCap,
    plan,
    habits,
    baselineKnown: Boolean(profile.baseline),
  });

  return (
    <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="eyebrow">PLAN TONIGHT · {today}</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.035em] text-ink mt-2">
          Set a plan <span className="italic text-accent">you&apos;ll actually keep</span>, {firstName}.
        </h1>
        <p className="font-display italic text-[17px] text-ink-muted mt-3 leading-snug">
          Recommendation first. Safety inputs tucked where they belong.
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
        className="rounded-[30px] border border-line bg-bg-card shadow-card overflow-hidden"
      >
        <div className="p-5">
          <div className="eyebrow">CHOOSE YOUR TARGET</div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {targetOptions.map((option) => (
              <TargetChip
                key={option}
                active={selectedTarget === option}
                label={drinkChipLabel(option)}
                onClick={() => {
                  setSelectionTouched(true);
                  setSelectedTarget(option);
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <MiniPill accent="#8C3A2A">
              easier line {drinkChipLabel(suggestedDrinkCap)}
            </MiniPill>
            <MiniPill accent={plan.drinksCap > suggestedDrinkCap ? '#B28034' : '#6F8D83'}>
              ceiling {drinkChipLabel(plan.drinksCap)}
            </MiniPill>
          </div>

          <div className="rounded-[24px] border border-line bg-[#FBF7EF] p-4 mt-5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="eyebrow">MAKE IT EASIER</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim">
                planning only
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {HABIT_ROWS.map((row) => {
                const Icon = row.icon;
                const checked = habits[row.key];
                const disabled = row.key === 'stop' && plan.lastCallMs === null;
                const detail = habitDetail(row.key, plan.lastCallMs);
                return (
                  <HabitRow
                    key={row.key}
                    checked={checked}
                    disabled={disabled}
                    icon={<Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />}
                    label={row.label}
                    detail={detail}
                    onToggle={() =>
                      setHabits((current) => ({
                        ...current,
                        [row.key]: disabled ? false : !current[row.key],
                      }))
                    }
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-[#F7F0E3] p-4 mt-5">
            <div className="grid grid-cols-[1fr,112px] gap-4 items-end">
              <div>
                <div className="flex items-center gap-2 text-ink-muted">
                  <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                  <span className="eyebrow !text-[9px]">GOOD CALL</span>
                </div>
                <div className="font-display text-[26px] leading-[1.08] tracking-[-0.03em] text-ink mt-2">
                  {prediction.title}
                </div>
                <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-2">
                  {prediction.body}
                </p>
              </div>
              <div className="h-[108px] rounded-[22px] overflow-hidden">
                <GlassStillLifeArt />
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-5"
            size="lg"
            disabled={(startLater && !plannedStartMs) || targetOptions.length === 0}
            onClick={() =>
              onStart(hours, {
                wakeAtMs: useWake ? wakeMs : undefined,
                planToDrive: driving,
                plannedStartMs,
                plannedDrinkCap: selectedTarget,
              })
            }
          >
            Save plan
          </Button>
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="w-full mt-3 font-display text-[15px] text-ink-muted transition hover:text-ink"
          >
            {advancedOpen ? 'Hide advanced safety' : 'Why this target?'}
          </button>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-4"
      >
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="w-full rounded-[26px] border border-line bg-bg-card px-5 py-4 text-left shadow-card transition hover:bg-white"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="eyebrow">ADVANCED SAFETY</div>
              <div className="font-display text-[23px] leading-[1.05] tracking-[-0.03em] text-ink mt-2">
                Duration, timing, wake-up, and driving.
              </div>
              <p className="font-display italic text-[14px] leading-snug text-ink-muted mt-2">
                {advancedSummary}
              </p>
            </div>
            {advancedOpen ? (
              <ChevronUp className="h-5 w-5 text-ink-muted shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-ink-muted shrink-0" />
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="rounded-[26px] border border-line bg-[#FBF7EF] p-5 mt-3">
                <div className="eyebrow">DURATION</div>
                <div className="font-display text-[48px] leading-none tracking-[-0.05em] text-ink mt-2">
                  {hours}
                  <span className="text-[22px] text-ink-muted ml-1">h</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={hours}
                  onChange={(event) => setHours(parseFloat(event.target.value))}
                  className="w-full mt-4"
                />
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim mt-2 px-1">
                  <span>1h</span>
                  <span>6h</span>
                  <span>12h</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <OptionButton
                    active={!startLater}
                    onClick={() => setStartLater(false)}
                    icon={<Zap className="h-3.5 w-3.5" />}
                    label="Right now"
                  />
                  <OptionButton
                    active={startLater}
                    onClick={() => setStartLater(true)}
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    label="Start later"
                  />
                </div>

                {startLater && (
                  <>
                    <input
                      type="datetime-local"
                      value={startDraft}
                      onChange={(event) => setStartDraft(event.target.value)}
                      className="w-full h-11 px-3 mt-3 rounded-xl bg-bg-card border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                    />
                    {!plannedStartMs && (
                      <div className="font-mono text-[10px] leading-snug tracking-tight text-risk-red mt-2">
                        Pick a future time, or switch back to right now.
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <OptionButton
                    active={useWake}
                    onClick={() => setUseWake(true)}
                    icon={<Moon className="h-3.5 w-3.5" />}
                    label="Set wake time"
                  />
                  <OptionButton
                    active={!useWake}
                    onClick={() => setUseWake(false)}
                    icon={<Target className="h-3.5 w-3.5" />}
                    label="No wake time"
                  />
                </div>

                {useWake && (
                  <input
                    type="datetime-local"
                    value={wakeDraft}
                    onChange={(event) => setWakeDraft(event.target.value)}
                    className="w-full h-11 px-3 mt-3 rounded-xl bg-bg-card border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                  />
                )}

                <div className="mt-5">
                  <div className="eyebrow">DRIVING</div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <OptionButton
                      active={!driving}
                      onClick={() => setDriving(false)}
                      icon={<Moon className="h-3.5 w-3.5" />}
                      label="Not driving"
                    />
                    <OptionButton
                      active={driving}
                      danger={driving}
                      onClick={() => setDriving(true)}
                      icon={<Car className="h-3.5 w-3.5" />}
                      label="Driving"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <p className="font-mono text-[10px] text-ink-dim text-center mt-4 uppercase tracking-[0.16em]">
        Estimates only. Never use this app to decide if you can drive.
      </p>
    </div>
  );
}

function TargetChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[76px] rounded-[20px] border px-4 py-3 text-center transition ${
        active
          ? 'border-accent bg-accent/10 text-accent shadow-press'
          : 'border-line bg-[#FCF8F1] text-ink hover:bg-white'
      }`}
    >
      <div className="font-display text-[29px] leading-none tracking-[-0.04em]">
        {label.replace(' drinks', '').replace(' drink', '')}
      </div>
      <div className="font-display text-[13px] leading-none mt-2">
        {label.includes('drink') ? label.split(' ').slice(1).join(' ') : 'drinks'}
      </div>
    </button>
  );
}

function HabitRow({
  checked,
  disabled,
  icon,
  label,
  detail,
  onToggle,
}: {
  checked: boolean;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  detail: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="w-full flex items-center justify-between gap-3 disabled:opacity-50"
    >
      <div className="flex items-center gap-3 text-left">
        <div className="text-ink-muted">{icon}</div>
        <div>
          <div className="font-display text-[17px] leading-none text-ink">
            {label}
          </div>
          <div className="font-display italic text-[13px] leading-snug text-ink-muted mt-1">
            {detail}
          </div>
        </div>
      </div>

      <div
        className={`relative h-7 w-12 rounded-full border transition ${
          checked ? 'border-[#6F8D83] bg-[#6F8D83]' : 'border-line bg-white'
        }`}
      >
        <span
          className={`absolute top-[2px] h-5.5 w-5.5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-[24px]' : 'left-[2px]'
          }`}
        />
      </div>
    </button>
  );
}

function MiniPill({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em]"
      style={{
        borderColor: `${accent}33`,
        color: accent,
        background: `${accent}10`,
      }}
    >
      {children}
    </div>
  );
}

function OptionButton({
  active,
  danger = false,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  danger?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-xl text-sm font-semibold min-tap transition-all ${
        active
          ? danger
            ? 'bg-risk-red text-white'
            : 'bg-accent text-white'
          : 'bg-bg-card border border-line text-ink-muted'
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

function habitDetail(key: HabitKey, lastCallMs: number | null): string {
  switch (key) {
    case 'water':
      return 'The easiest habit to keep the morning softer.';
    case 'meal':
      return 'A real meal buys you more room than intentions do.';
    case 'stop':
      return lastCallMs !== null
        ? `Aim to stop by ${formatClockWithDay(lastCallMs, Date.now())}.`
        : 'No meaningful stop time yet with this setup.';
    case 'ride':
      return 'Especially useful if you plan on driving tomorrow.';
  }
}

function buildAdvancedSummary({
  hours,
  plannedStartMs,
  useWake,
  wakeMs,
  driving,
}: {
  hours: number;
  plannedStartMs?: number;
  useWake: boolean;
  wakeMs?: number;
  driving: boolean;
}): string {
  const parts = [`${hours}h session`];
  if (plannedStartMs) {
    parts.push(`starts ${formatClockWithDay(plannedStartMs, Date.now())}`);
  } else {
    parts.push('starts now');
  }
  if (useWake && wakeMs) {
    parts.push(`wake ${formatClockWithDay(wakeMs, Date.now())}`);
  }
  if (driving) {
    parts.push('driving on');
  }
  return parts.join(' · ');
}

function drinkChipLabel(value: number): string {
  return `${value} drink${value === 1 ? '' : 's'}`;
}

function buildPredictionCopy({
  selectedTarget,
  suggestedDrinkCap,
  plannerCap,
  plan,
  habits,
  baselineKnown,
}: {
  selectedTarget: number;
  suggestedDrinkCap: number;
  plannerCap: number;
  plan: ReturnType<typeof planNight>;
  habits: Record<HabitKey, boolean>;
  baselineKnown: boolean;
}): { title: string; body: string } {
  if (selectedTarget === 0) {
    return {
      title: 'That is the cleanest call.',
      body: baselineKnown
        ? 'A dry night buys the easiest morning and keeps the pattern honest.'
        : 'A dry night keeps things simple while the app learns your baseline.',
    };
  }

  if (selectedTarget < suggestedDrinkCap) {
    return {
      title: 'Conservative is a good look tonight.',
      body: `You are ${suggestedDrinkCap - selectedTarget} under the easier line, which gives tomorrow extra margin.`,
    };
  }

  if (selectedTarget === suggestedDrinkCap) {
    return {
      title: 'Good call.',
      body: `${drinkChipLabel(selectedTarget)} with ${
        habits.water || habits.meal ? 'a couple of habits' : 'steady pacing'
      } keeps you in the clearer lane for tomorrow.`,
    };
  }

  if (selectedTarget >= plannerCap) {
    return {
      title: 'You are right on the ceiling.',
      body:
        plan.lastCallMs !== null
          ? `That uses almost all the room in this plan. Stop by ${formatClockWithDay(plan.lastCallMs, Date.now())} if you want the safety side of it to hold.`
          : 'That uses almost all the room in this plan, so the habits matter more than usual.',
    };
  }

  return {
    title: 'This is still workable.',
    body: `You are ${selectedTarget - suggestedDrinkCap} above the easier line, so keep the night slow and spaced out.`,
  };
}
