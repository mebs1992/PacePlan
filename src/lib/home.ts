import { endedSessions } from '@/lib/insights';
import { planNight, type NightPlan } from '@/lib/plan';
import type { Profile, Session } from '@/types';

export const HYDRATION_TARGET_GLASSES = 8;
const DAY_MS = 86_400_000;

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

export function hydrationForDay(hydrationByDay: Record<string, number>, atMs: number): number {
  return hydrationByDay[dayKey(atMs)] ?? 0;
}

export function hydrationScore(glasses: number, target: number = HYDRATION_TARGET_GLASSES): number {
  return Math.max(0, Math.min(100, Math.round((glasses / target) * 100)));
}

export function hydrationBand(score: number): {
  label: string;
  tone: string;
  accent: string;
  message: string;
} {
  if (score >= 100) {
    return {
      label: 'Topped up',
      tone: 'text-risk-green',
      accent: '#3A5E4C',
      message: 'Nice buffer. Keep a glass between rounds if tonight turns lively.',
    };
  }
  if (score >= 65) {
    return {
      label: 'Steady',
      tone: 'text-risk-green',
      accent: '#3A5E4C',
      message: 'You are starting from a decent place. A little more water keeps the edge.',
    };
  }
  if (score >= 35) {
    return {
      label: 'Building',
      tone: 'text-risk-yellow',
      accent: '#B28034',
      message: 'You have started the day well. Two more glasses would make tonight gentler.',
    };
  }
  return {
    label: 'Running dry',
    tone: 'text-risk-red',
    accent: '#8C3A2A',
    message: 'Today looks light on water. Logging a couple more glasses is the easiest win.',
  };
}

export function hydrationStreak(hydrationByDay: Record<string, number>, now: number): number {
  let streak = 0;
  for (let cursor = startOfDay(now); ; cursor -= DAY_MS) {
    if ((hydrationByDay[dayKey(cursor)] ?? 0) <= 0) break;
    streak += 1;
  }
  return streak;
}

export function hydrationTargetDays(
  hydrationByDay: Record<string, number>,
  now: number,
  target: number = HYDRATION_TARGET_GLASSES,
  days: number = 7
): number {
  let hits = 0;
  for (let i = 0; i < days; i++) {
    const cursor = startOfDay(now) - i * DAY_MS;
    if ((hydrationByDay[dayKey(cursor)] ?? 0) >= target) hits += 1;
  }
  return hits;
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
  now: number
): {
  plan: NightPlan;
  plannedStartMs: number;
  expectedHours: number;
  wakeAtMs: number;
} {
  const lastSession = endedSessions(history)[0];
  const plannedStartMs = nextForecastStart(now);
  const expectedHours = Math.min(8, Math.max(3, lastSession?.expectedHours ?? 4));
  const wakeAtMs = forecastWakeAt(plannedStartMs, lastSession);

  return {
    plan: planNight({
      profile,
      plannedStartMs,
      expectedHours,
      wakeAtMs,
      driving: false,
    }),
    plannedStartMs,
    expectedHours,
    wakeAtMs,
  };
}

export function recentRecoveryCopy(history: Session[], now: number): string {
  const lastEnded = endedSessions(history)[0];
  if (!lastEnded?.endedAt) {
    return 'A quiet dashboard for the nights ahead and the mornings after.';
  }

  const hoursSince = (now - lastEnded.endedAt) / (60 * 60 * 1000);
  if (hoursSince < 12) return 'Recovery mode. Keep today light and let your body reset.';
  if (hoursSince < 30) return 'You are mostly clear again. Hydration today gives tonight more room.';
  return 'Clear day. Good moment to set the pace before the next night out.';
}

export function noDrinkStreak(history: Session[], now: number): number {
  const ended = endedSessions(history);
  let streak = 0;
  const oldestStartedAt = ended[ended.length - 1]?.startedAt;
  for (let cursor = startOfDay(now); ; cursor -= DAY_MS) {
    const key = dayKey(cursor);
    const drankThatDay = ended.some((session) => dayKey(session.startedAt) === key);
    if (drankThatDay) break;
    streak += 1;
    if (oldestStartedAt === undefined && streak >= 30) break;
    if (oldestStartedAt !== undefined && cursor <= startOfDay(oldestStartedAt)) break;
  }
  return streak;
}
