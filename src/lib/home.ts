import { endedSessions } from '@/lib/insights';
import { planNight, type NightPlan } from '@/lib/plan';
import {
  buildBaselineModel,
  personalizedEasyMorningLine,
} from '@/lib/baseline';
import type { DrinkEntry, Profile, Session } from '@/types';

const DAY_MS = 86_400_000;
const SLEEP_TARGET_HOURS = 8;
const ALCOHOL_LOAD_MAX = 40;
const RECOVERY_PLATEAU_DAYS = 4;
const GLASS_ML = 250;
const AVG_ROUND_STD = 1.4;

export type ReadinessBand = {
  label: string;
  accent: string;
  tone: string;
  message: string;
};

export type GoalRow = {
  key: 'hydration' | 'sleep' | 'recovery';
  label: string;
  current: string;
  target: string;
  note: string;
  progress: number;
  accent: string;
  done: boolean;
};

export type ReadinessFactor = {
  key: 'hydration' | 'sleep' | 'recovery' | 'load';
  label: string;
  normalized: number;
  points: number;
  value: string;
  note: string;
  accent: string;
};

export type ReadinessAction = {
  kind: 'water' | 'sleep' | 'session';
  label: string;
  sub: string;
};

export type ReadinessSnapshot = {
  hasBaseline: boolean;
  usingProfileBaseline: boolean;
  score: number | null;
  band: ReadinessBand;
  delta: number | null;
  waterTodayMl: number;
  waterTargetMl: number;
  sleepTodayHours: number;
  drinks7dSum: number;
  daysSinceLastDrink: number;
  checkInStreak: number;
  goals: GoalRow[];
  factors: ReadinessFactor[];
  primaryAction: ReadinessAction;
};

export type DrinkingOutlook = {
  score: number | null;
  label: 'Needs baseline' | 'None' | 'Mild' | 'Rough' | 'Brutal';
  accent: string;
  tone: string;
  message: string;
};

type ReadinessInputs = {
  profile: Profile;
  history: Session[];
  active: Session | null;
  hydrationByDay: Record<string, number>;
  sleepByDay: Record<string, number>;
  atMs: number;
};

type ResolvedReadiness = {
  hasBaseline: boolean;
  usingProfileBaseline: boolean;
  hs: number;
  ss: number;
  drinks7dSum: number;
  als: number;
  dryDays: number;
  rs: number;
  waterTodayMl: number;
  targetMl: number;
  sleepTodayHours: number;
  waterProgress: number;
  sleepProgress: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function waterGlassesForDay(
  hydrationByDay: Record<string, number>,
  atMs: number,
): number {
  return hydrationByDay[dayKey(atMs)] ?? 0;
}

export function waterMlForDay(
  hydrationByDay: Record<string, number>,
  atMs: number,
): number {
  return waterGlassesForDay(hydrationByDay, atMs) * GLASS_ML;
}

export function sleepHoursForDay(
  sleepByDay: Record<string, number>,
  atMs: number,
): number {
  return sleepByDay[dayKey(atMs)] ?? 0;
}

export function waterTargetMl(weightKg: number): number {
  return Math.round(weightKg * 35);
}

function allDrinkEntries(
  history: Session[],
  active: Session | null,
  atMs: number,
): DrinkEntry[] {
  const ended = endedSessions(history)
    .flatMap((session) => session.drinks)
    .filter((drink) => drink.at <= atMs);
  const live = active
    ? active.drinks.filter((drink) => drink.at <= atMs)
    : [];
  return [...ended, ...live];
}

function hasRecordedDays(record: Record<string, number>): boolean {
  return Object.keys(record).length > 0;
}

function hasRecordedDay(record: Record<string, number>, atMs: number): boolean {
  return Object.prototype.hasOwnProperty.call(record, dayKey(atMs));
}

function hasDrinkHistory(
  history: Session[],
  active: Session | null,
  atMs: number,
): boolean {
  return allDrinkEntries(history, active, atMs).length > 0;
}

function hasBaselineData(
  profile: Profile,
  _hydrationByDay: Record<string, number>,
  sleepByDay: Record<string, number>,
  history: Session[],
  active: Session | null,
  atMs: number,
): boolean {
  return (
    Boolean(profile.baseline) ||
    hasDrinkHistory(history, active, atMs) ||
    hasRecordedDays(sleepByDay)
  );
}

function hydrationScoreAt(
  hydrationByDay: Record<string, number>,
  weightKg: number,
  atMs: number,
): number {
  return clamp01(waterMlForDay(hydrationByDay, atMs) / waterTargetMl(weightKg));
}

function sleepScoreAt(
  sleepByDay: Record<string, number>,
  atMs: number,
): number {
  return clamp01(sleepHoursForDay(sleepByDay, atMs) / SLEEP_TARGET_HOURS);
}

function rollingAverage(
  compute: (atMs: number) => number,
  atMs: number,
  days: number,
): number {
  return avg(
    Array.from({ length: days }, (_, index) =>
      compute(startOfDay(atMs) - index * DAY_MS),
    ),
  );
}

function blendedRollingAverage(
  compute: (atMs: number) => number,
  hasRecordedAt: (atMs: number) => boolean,
  atMs: number,
  days: number,
  fallback: number,
): number {
  return avg(
    Array.from({ length: days }, (_, index) => {
      const cursor = startOfDay(atMs) - index * DAY_MS;
      return hasRecordedAt(cursor) ? compute(cursor) : fallback;
    }),
  );
}

function drinksInLastDays(
  history: Session[],
  active: Session | null,
  atMs: number,
  days: number,
): number {
  const cutoff = atMs - days * DAY_MS;
  return allDrinkEntries(history, active, atMs)
    .filter((drink) => drink.at >= cutoff)
    .reduce((sum, drink) => sum + drink.standardDrinks, 0);
}

function lastDrinkAt(
  history: Session[],
  active: Session | null,
  atMs: number,
): number | null {
  const entries = allDrinkEntries(history, active, atMs);
  if (entries.length === 0) return null;
  return entries.reduce((latest, drink) => Math.max(latest, drink.at), entries[0].at);
}

function daysSinceLastDrink(
  history: Session[],
  active: Session | null,
  atMs: number,
): number {
  const latest = lastDrinkAt(history, active, atMs);
  if (latest === null) return RECOVERY_PLATEAU_DAYS;
  return Math.max(0, Math.floor((atMs - latest) / DAY_MS));
}

function hasCheckInOnDay(
  hydrationByDay: Record<string, number>,
  sleepByDay: Record<string, number>,
  history: Session[],
  active: Session | null,
  atMs: number,
): boolean {
  const key = dayKey(atMs);
  if (Object.prototype.hasOwnProperty.call(hydrationByDay, key)) return true;
  if (Object.prototype.hasOwnProperty.call(sleepByDay, key)) return true;
  return allDrinkEntries(history, active, atMs + DAY_MS - 1).some(
    (drink) => dayKey(drink.at) === key,
  );
}

export function checkInStreak(
  hydrationByDay: Record<string, number>,
  sleepByDay: Record<string, number>,
  history: Session[],
  active: Session | null,
  now: number,
): number {
  let streak = 0;
  for (let cursor = startOfDay(now); ; cursor -= DAY_MS) {
    if (!hasCheckInOnDay(hydrationByDay, sleepByDay, history, active, cursor)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function readinessBand(score: number | null): ReadinessBand {
  if (score === null) {
    return {
      label: 'Build your baseline',
      accent: '#B28034',
      tone: 'text-risk-yellow',
      message: 'Log water and last night’s sleep first. Then this turns into a personal read instead of a guess.',
    };
  }
  if (score >= 70) {
    return {
      label: 'Good night',
      accent: '#3A5E4C',
      tone: 'text-risk-green',
      message: 'You are coming in with a decent buffer. Keep the pace clean and you will feel it tomorrow.',
    };
  }
  if (score >= 40) {
    return {
      label: 'Moderate risk',
      accent: '#B28034',
      tone: 'text-risk-yellow',
      message: 'Tonight is manageable, but a few cleaner choices still move the line in your favor.',
    };
  }
  return {
    label: 'Poor night to drink',
    accent: '#8C3A2A',
    tone: 'text-risk-red',
    message: 'Your body is still catching up. Water, sleep, or another dry day would help more than another round.',
  };
}

function actionFor(
  hasBaseline: boolean,
  waterProgress: number,
  sleepProgress: number,
): ReadinessAction {
  if (!hasBaseline) {
    return {
      kind: 'water',
      label: 'Log 250mL water',
      sub: 'Or add last night’s sleep to start your baseline.',
    };
  }
  if (waterProgress < 0.7) {
    return {
      kind: 'water',
      label: 'Add 250mL water',
      sub: 'Hydration is the fastest thing you can improve right now.',
    };
  }
  if (sleepProgress < 0.75) {
    return {
      kind: 'sleep',
      label: 'Log another hour of sleep',
      sub: 'Sleep is the next biggest lever on tonight’s line.',
    };
  }
  return {
    kind: 'session',
    label: 'Open tonight planner',
    sub: 'You have enough baseline to set a line for tonight.',
  };
}

function goalAccent(progress: number): string {
  if (progress >= 0.85) return '#3A5E4C';
  if (progress >= 0.5) return '#B28034';
  return '#8C3A2A';
}

function buildGoals(
  waterTodayMl: number,
  waterTarget: number,
  sleepTodayHours: number,
  dryDays: number,
): GoalRow[] {
  const waterProgress = clamp01(waterTodayMl / waterTarget);
  const sleepProgress = clamp01(sleepTodayHours / SLEEP_TARGET_HOURS);
  const recoveryProgress = clamp01(dryDays / RECOVERY_PLATEAU_DAYS);

  return [
    {
      key: 'hydration',
      label: 'Water',
      current: `${(waterTodayMl / 1000).toFixed(1)}L`,
      target: `${(waterTarget / 1000).toFixed(1)}L target`,
      note:
        waterProgress >= 1
          ? 'Topped up for today.'
          : `${Math.max(0, Math.round((waterTarget - waterTodayMl) / GLASS_ML))} glasses to go.`,
      progress: waterProgress,
      accent: goalAccent(waterProgress),
      done: waterProgress >= 1,
    },
    {
      key: 'sleep',
      label: 'Sleep',
      current: `${sleepTodayHours.toFixed(1)}h`,
      target: `${SLEEP_TARGET_HOURS}h target`,
      note:
        sleepProgress >= 1
          ? 'Sleep goal hit.'
          : `${Math.max(0, (SLEEP_TARGET_HOURS - sleepTodayHours)).toFixed(1)}h under target.`,
      progress: sleepProgress,
      accent: goalAccent(sleepProgress),
      done: sleepProgress >= 1,
    },
    {
      key: 'recovery',
      label: 'Recovery',
      current: `${Math.min(dryDays, RECOVERY_PLATEAU_DAYS)}/${RECOVERY_PLATEAU_DAYS}`,
      target: 'dry days',
      note:
        recoveryProgress >= 1
          ? 'Recovery buffer topped out.'
          : `${RECOVERY_PLATEAU_DAYS - Math.min(dryDays, RECOVERY_PLATEAU_DAYS)} more dry days for full buffer.`,
      progress: recoveryProgress,
      accent: goalAccent(recoveryProgress),
      done: recoveryProgress >= 1,
    },
  ];
}

function resolveReadiness(inputs: ReadinessInputs): ResolvedReadiness {
  const baseline = buildBaselineModel(inputs.profile.baseline);
  const hasHydrationHistory = hasRecordedDays(inputs.hydrationByDay);
  const hasSleepHistory = hasRecordedDays(inputs.sleepByDay);
  const hasRealDrinkHistory = hasDrinkHistory(inputs.history, inputs.active, inputs.atMs);
  const hasBaseline = hasBaselineData(
    inputs.profile,
    inputs.hydrationByDay,
    inputs.sleepByDay,
    inputs.history,
    inputs.active,
    inputs.atMs,
  );

  const hs = hasHydrationHistory
    ? blendedRollingAverage(
        (cursor) => hydrationScoreAt(inputs.hydrationByDay, inputs.profile.weightKg, cursor),
        (cursor) => hasRecordedDay(inputs.hydrationByDay, cursor),
        inputs.atMs,
        3,
        baseline?.hydrationScore ?? 0,
      )
    : baseline?.hydrationScore ?? 0;
  const ss = hasSleepHistory
    ? blendedRollingAverage(
        (cursor) => sleepScoreAt(inputs.sleepByDay, cursor),
        (cursor) => hasRecordedDay(inputs.sleepByDay, cursor),
        inputs.atMs,
        3,
        baseline?.sleepScore ?? 0,
      )
    : baseline?.sleepScore ?? 0;
  const drinks7dSum = hasRealDrinkHistory
    ? drinksInLastDays(inputs.history, inputs.active, inputs.atMs, 7)
    : baseline?.drinks7dSum ?? 0;
  const als = clamp01(drinks7dSum / ALCOHOL_LOAD_MAX);
  const dryDays = hasRealDrinkHistory
    ? daysSinceLastDrink(inputs.history, inputs.active, inputs.atMs)
    : baseline
      ? 2
      : RECOVERY_PLATEAU_DAYS;
  const rs = hasRealDrinkHistory
    ? clamp01(dryDays / RECOVERY_PLATEAU_DAYS)
    : baseline?.recoveryScore ?? clamp01(dryDays / RECOVERY_PLATEAU_DAYS);
  const waterTodayMl = waterMlForDay(inputs.hydrationByDay, inputs.atMs);
  const targetMl = waterTargetMl(inputs.profile.weightKg);
  const sleepTodayHours = sleepHoursForDay(inputs.sleepByDay, inputs.atMs);
  const waterProgress = clamp01(waterTodayMl / targetMl);
  const sleepProgress = clamp01(sleepTodayHours / SLEEP_TARGET_HOURS);

  return {
    hasBaseline,
    usingProfileBaseline:
      Boolean(baseline) && (!hasHydrationHistory || !hasSleepHistory || !hasRealDrinkHistory),
    hs,
    ss,
    drinks7dSum,
    als,
    dryDays,
    rs,
    waterTodayMl,
    targetMl,
    sleepTodayHours,
    waterProgress,
    sleepProgress,
  };
}

export function buildReadinessSnapshot({
  profile,
  history,
  active,
  hydrationByDay,
  sleepByDay,
  atMs,
}: ReadinessInputs): ReadinessSnapshot {
  const resolved = resolveReadiness({
    profile,
    history,
    active,
    hydrationByDay,
    sleepByDay,
    atMs,
  });
  const score = resolved.hasBaseline
    ? Math.round(
        clampRange(
          100 *
            (0.35 * resolved.hs +
              0.25 * resolved.ss +
              0.25 * resolved.rs +
              0.15 * (1 - resolved.als)),
          0,
          100,
        ),
      )
    : null;

  const hadBaselineYesterday = hasBaselineData(
    profile,
    hydrationByDay,
    sleepByDay,
    history,
    active,
    startOfDay(atMs) - 1,
  );
  const yesterdayScore = hadBaselineYesterday
    ? buildReadinessSnapshotCore({
        profile,
        history,
        active,
        hydrationByDay,
        sleepByDay,
        atMs: startOfDay(atMs) - 1,
      })
    : null;

  return {
    hasBaseline: resolved.hasBaseline,
    usingProfileBaseline: resolved.usingProfileBaseline,
    score,
    band: readinessBand(score),
    delta:
      score !== null && yesterdayScore !== null ? score - Math.round(yesterdayScore) : null,
    waterTodayMl: resolved.waterTodayMl,
    waterTargetMl: resolved.targetMl,
    sleepTodayHours: resolved.sleepTodayHours,
    drinks7dSum: resolved.drinks7dSum,
    daysSinceLastDrink: resolved.dryDays,
    checkInStreak: checkInStreak(hydrationByDay, sleepByDay, history, active, atMs),
    goals: buildGoals(
      resolved.waterTodayMl,
      resolved.targetMl,
      resolved.sleepTodayHours,
      resolved.dryDays,
    ),
    factors: [
      {
        key: 'hydration',
        label: 'Hydration',
        normalized: resolved.hs,
        points: Math.round(35 * resolved.hs),
        value: `${(resolved.waterTodayMl / 1000).toFixed(1)} / ${(resolved.targetMl / 1000).toFixed(1)}L`,
        note: resolved.usingProfileBaseline
          ? 'Starts from your usual hydration habits until real water logs take over.'
          : 'Uses your 3-day hydration average against your daily target.',
        accent: goalAccent(resolved.hs),
      },
      {
        key: 'sleep',
        label: 'Sleep',
        normalized: resolved.ss,
        points: Math.round(25 * resolved.ss),
        value:
          hasBaselineData(profile, hydrationByDay, sleepByDay, history, active, atMs) &&
          hasRecordedDays(sleepByDay)
          ? `${rollingAverage((cursor) => sleepHoursForDay(sleepByDay, cursor), atMs, 3).toFixed(1)}h avg`
          : profile.baseline
            ? 'usual sleep baseline'
            : '0.0h avg',
        note: resolved.usingProfileBaseline
          ? 'Starts from your usual sleep pattern until you log last night.'
          : 'Three nights of sleep smooth the landing.',
        accent: goalAccent(resolved.ss),
      },
      {
        key: 'recovery',
        label: 'Recovery',
        normalized: resolved.rs,
        points: Math.round(25 * resolved.rs),
        value: `${Math.min(resolved.dryDays, RECOVERY_PLATEAU_DAYS)} of ${RECOVERY_PLATEAU_DAYS} dry days`,
        note: resolved.usingProfileBaseline
          ? 'Starts from a moderate recovery buffer until real nights are logged.'
          : 'Recovery tops out after four clear days.',
        accent: goalAccent(resolved.rs),
      },
      {
        key: 'load',
        label: 'Recent load',
        normalized: 1 - resolved.als,
        points: Math.round(15 * (1 - resolved.als)),
        value: `${resolved.drinks7dSum.toFixed(1)} std / 7d`,
        note: resolved.usingProfileBaseline
          ? 'Starts from your usual weekly pattern until the app sees real sessions.'
          : 'Lighter weeks leave more room tonight.',
        accent: goalAccent(1 - resolved.als),
      },
    ],
    primaryAction: actionFor(
      resolved.hasBaseline,
      resolved.waterProgress,
      resolved.sleepProgress,
    ),
  };
}

function buildReadinessSnapshotCore(inputs: ReadinessInputs): number {
  const resolved = resolveReadiness(inputs);
  return clampRange(
    100 *
      (0.35 * resolved.hs +
        0.25 * resolved.ss +
        0.25 * resolved.rs +
        0.15 * (1 - resolved.als)),
    0,
    100,
  );
}

function withTime(baseMs: number, hour: number, minute: number): number {
  const d = new Date(baseMs);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function nextForecastStart(now: number): number {
  const tonight = withTime(now, 20, 0);
  if (now <= tonight - 60 * 60_000) return tonight;

  const tomorrow = new Date(now + DAY_MS);
  tomorrow.setHours(20, 0, 0, 0);
  return tomorrow.getTime();
}

function forecastWakeAt(plannedStartMs: number, lastSession?: Session): number {
  if (lastSession?.wakeAtMs) {
    const wake = new Date(lastSession.wakeAtMs);
    const out = new Date(plannedStartMs);
    out.setDate(out.getDate() + 1);
    out.setHours(wake.getHours(), wake.getMinutes(), 0, 0);
    return out.getTime();
  }
  return withTime(plannedStartMs + DAY_MS, 8, 0);
}

export function buildTonightForecast(
  profile: Profile,
  history: Session[],
  now: number,
): {
  plan: NightPlan;
  plannedStartMs: number;
  expectedHours: number;
  wakeAtMs: number;
  suggestedEasyMorningLine: number;
} {
  const lastSession = endedSessions(history)[0];
  const plannedStartMs = nextForecastStart(now);
  const baseline = buildBaselineModel(profile.baseline);
  const expectedHours = Math.min(
    8,
    Math.max(3, lastSession?.expectedHours ?? baseline?.expectedHours ?? 4),
  );
  const wakeAtMs = forecastWakeAt(plannedStartMs, lastSession);
  const plan = planNight({
    profile,
    plannedStartMs,
    expectedHours,
    wakeAtMs,
    driving: false,
  });

  return {
    plan,
    plannedStartMs,
    expectedHours,
    wakeAtMs,
    suggestedEasyMorningLine: personalizedEasyMorningLine(
      profile.baseline,
      plan.drinksCap,
      baseline?.readinessScore ?? null,
    ),
  };
}

export function forecastDrinkingOutlook(
  readinessScore: number | null,
  plannedDrinks: number,
  recommendedDrinks: number,
  sensitivityMultiplier: number = 1,
): DrinkingOutlook {
  if (readinessScore === null) {
    return {
      score: null,
      label: 'Needs baseline',
      accent: '#8A8374',
      tone: 'text-ink-muted',
      message: 'Add a water or sleep check-in first and this turns from a generic forecast into a personal one.',
    };
  }

  const plannedStd = plannedDrinks * AVG_ROUND_STD;
  const overage = Math.max(0, plannedDrinks - recommendedDrinks);
  const score = clampRange(
    plannedStd * (1.15 - readinessScore / 120) * sensitivityMultiplier + overage * 0.9,
    0,
    10,
  );

  if (score <= 2) {
    return {
      score,
      label: 'None',
      accent: '#3A5E4C',
      tone: 'text-risk-green',
      message: 'Inside the line. Keep water moving and the morning should stay calm.',
    };
  }
  if (score <= 4) {
    return {
      score,
      label: 'Mild',
      accent: '#3A5E4C',
      tone: 'text-risk-green',
      message: 'Manageable if you stick to the pace and do not let the drinks bunch up.',
    };
  }
  if (score <= 7) {
    return {
      score,
      label: 'Rough',
      accent: '#B28034',
      tone: 'text-risk-yellow',
      message: 'This starts to bite tomorrow. Food, water, and a slower pace all matter here.',
    };
  }
  return {
    score,
    label: 'Brutal',
    accent: '#8C3A2A',
    tone: 'text-risk-red',
    message: 'You are planning well past your cushion. Expect a hard landing unless the plan changes.',
  };
}
