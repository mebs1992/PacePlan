import type { DrinkEntry, FoodEntry, HangoverRisk, Profile, RiskLevel } from '@/types';
import { GRAMS_PER_STANDARD_DRINK_AU } from './drinks';

export const BETA_LOW = 0.12;
export const BETA_TYPICAL = 0.15;
export const BETA_HIGH = 0.20;

export const TARGET_PEAK_BAC = 0.055;
export const RISK_GREEN_MAX = 0.04;
export const RISK_YELLOW_MAX = 0.06;

const R_MALE = 0.68;
const R_FEMALE = 0.55;

const HOUR_MS = 60 * 60 * 1000;
const SIM_STEP_MS = 60_000;

function widmarkR(profile: Profile): number {
  return profile.sex === 'male' ? R_MALE : R_FEMALE;
}

type StomachState = 'empty' | 'snack' | 'full';

function stomachStateAt(food: FoodEntry[], at: number): StomachState {
  let state: StomachState = 'empty';
  for (const entry of food) {
    if (entry.at > at) continue;
    const hoursSince = (at - entry.at) / HOUR_MS;
    if (entry.size === 'meal') {
      if (hoursSince < 2) state = 'full';
      else if (hoursSince < 4 && state !== 'full') state = 'snack';
    } else if (entry.size === 'snack') {
      if (hoursSince < 2 && state !== 'full') state = 'snack';
    }
  }
  return state;
}

function absorptionMinutesFor(state: StomachState): number {
  switch (state) {
    case 'full':
      return 75;
    case 'snack':
      return 45;
    case 'empty':
    default:
      return 20;
  }
}

export type BacInputs = {
  profile: Profile;
  drinks: DrinkEntry[];
  food: FoodEntry[];
  at: number;
};

/**
 * Discrete-time simulation: alcohol absorbs linearly over each drink's window,
 * elimination is zero-order (constant β g/L per hour) and clamps BAC at 0
 * (so post-zero gaps don't accrue "elimination credit").
 */
export function computeBacAt(inputs: BacInputs, beta: number = BETA_TYPICAL): number {
  const { profile, drinks, food, at } = inputs;
  const sorted = drinks.filter((d) => d.at <= at).sort((a, b) => a.at - b.at);
  if (sorted.length === 0) return 0;

  const r = widmarkR(profile);
  const W = profile.weightKg;

  const drinkPlans = sorted.map((d) => {
    const state = stomachStateAt(food, d.at);
    const absorptionMs = absorptionMinutesFor(state) * 60_000;
    return {
      grams: d.standardDrinks * GRAMS_PER_STANDARD_DRINK_AU,
      start: d.at,
      end: d.at + absorptionMs,
      absorptionMs,
    };
  });

  let bacGperL = 0;
  let t = sorted[0].at;
  while (t < at) {
    const next = Math.min(t + SIM_STEP_MS, at);
    const dtHr = (next - t) / HOUR_MS;

    let absorbedGrams = 0;
    for (const plan of drinkPlans) {
      if (plan.absorptionMs === 0) continue;
      const overlapStart = Math.max(t, plan.start);
      const overlapEnd = Math.min(next, plan.end);
      if (overlapEnd > overlapStart) {
        const fraction = (overlapEnd - overlapStart) / plan.absorptionMs;
        absorbedGrams += plan.grams * fraction;
      }
    }
    bacGperL += absorbedGrams / (W * r);
    bacGperL = Math.max(0, bacGperL - beta * dtHr);

    t = next;
  }
  return gPerLToPercent(bacGperL);
}

export function gPerLToPercent(gPerL: number): number {
  return gPerL / 10;
}

export function percentToGPerL(percent: number): number {
  return percent * 10;
}

export type BacRange = { low: number; typical: number; high: number };

export function computeBacRange(inputs: BacInputs): BacRange {
  return {
    low: computeBacAt(inputs, BETA_HIGH),
    typical: computeBacAt(inputs, BETA_TYPICAL),
    high: computeBacAt(inputs, BETA_LOW),
  };
}

export function riskFor(bacPercent: number): RiskLevel {
  if (bacPercent < RISK_GREEN_MAX) return 'green';
  if (bacPercent < RISK_YELLOW_MAX) return 'yellow';
  return 'red';
}

export function soberAtMs(inputs: BacInputs): number | null {
  const current = computeBacAt(inputs, BETA_TYPICAL);
  if (current <= 0) return null;
  const hoursToZero = percentToGPerL(current) / BETA_TYPICAL;
  return inputs.at + hoursToZero * HOUR_MS;
}

export type CutoffResult =
  | { kind: 'safe'; cutoffAt: number }
  | { kind: 'over'; bacAtSessionEnd: number }
  | { kind: 'no-drinks' };

export function recommendCutoff(
  inputs: BacInputs,
  sessionEndsAt: number,
  averageDrinkSize: number = 1.4
): CutoffResult {
  if (inputs.drinks.length === 0 && inputs.at >= sessionEndsAt) {
    return { kind: 'no-drinks' };
  }

  const probeBacEnd = peakBacInWindow(
    inputs.profile,
    inputs.drinks,
    inputs.food,
    inputs.at,
    sessionEndsAt
  );
  if (probeBacEnd > TARGET_PEAK_BAC) {
    return { kind: 'over', bacAtSessionEnd: probeBacEnd };
  }

  const stepMs = 10 * 60_000;
  let lastSafe: number | null = null;

  for (let candidate = inputs.at; candidate <= sessionEndsAt; candidate += stepMs) {
    const probeDrink: DrinkEntry = {
      id: 'probe',
      type: 'custom',
      label: 'probe',
      standardDrinks: averageDrinkSize,
      at: candidate,
    };
    const projectedPeak = peakBacInWindow(
      inputs.profile,
      [...inputs.drinks, probeDrink],
      inputs.food,
      candidate,
      sessionEndsAt + 90 * 60_000
    );
    if (projectedPeak <= TARGET_PEAK_BAC) {
      lastSafe = candidate;
    }
  }

  if (lastSafe === null) {
    return { kind: 'over', bacAtSessionEnd: probeBacEnd };
  }
  return { kind: 'safe', cutoffAt: lastSafe };
}

export function suggestedDrinksRemaining(
  inputs: BacInputs,
  sessionEndsAt: number,
  averageDrinkSize: number = 1.4
): number {
  let count = 0;
  const drinks = [...inputs.drinks];
  const remainingMs = Math.max(0, sessionEndsAt - inputs.at);
  if (remainingMs === 0) return 0;
  const slotMs = 30 * 60_000;
  const slots = Math.max(1, Math.floor(remainingMs / slotMs));

  for (let i = 0; i < slots; i++) {
    const candidateAt = inputs.at + i * slotMs;
    const trial: DrinkEntry[] = [
      ...drinks,
      {
        id: `probe-${i}`,
        type: 'custom',
        label: 'probe',
        standardDrinks: averageDrinkSize,
        at: candidateAt,
      },
    ];
    const peak = peakBacInWindow(
      inputs.profile,
      trial,
      inputs.food,
      inputs.at,
      sessionEndsAt + 90 * 60_000
    );
    if (peak > TARGET_PEAK_BAC) break;
    drinks.push(trial[trial.length - 1]);
    count += 1;
  }
  return count;
}

export function waterBehind(drinks: DrinkEntry[], waterCount: number): boolean {
  return drinks.length > 0 && waterCount < Math.max(0, drinks.length - 1);
}

export const HANGOVER_PEAK_LOW = 0.05;
export const HANGOVER_PEAK_MODERATE = 0.08;
export const HANGOVER_PEAK_SEVERE = 0.11;
export const HANGOVER_WAKE_STILL_DRUNK = 0.02;

export function hangoverRiskFor(
  peakBac: number,
  bacAtWake: number,
  waterBehindGlasses: number
): HangoverRisk {
  if (bacAtWake >= HANGOVER_WAKE_STILL_DRUNK) return 'severe';
  if (peakBac >= HANGOVER_PEAK_SEVERE) return 'severe';
  let tier: HangoverRisk = 'low';
  if (peakBac >= HANGOVER_PEAK_MODERATE) tier = 'high';
  else if (peakBac >= HANGOVER_PEAK_LOW) tier = 'moderate';
  if (waterBehindGlasses >= 3 && tier === 'low') tier = 'moderate';
  else if (waterBehindGlasses >= 3 && tier === 'moderate') tier = 'high';
  return tier;
}

export function hangoverLabel(risk: HangoverRisk): string {
  switch (risk) {
    case 'low':
      return 'Low hangover risk';
    case 'moderate':
      return 'Moderate hangover risk';
    case 'high':
      return 'High hangover risk';
    case 'severe':
      return 'Rough morning ahead';
  }
}

/**
 * Estimate how many more average drinks you can log before your projected
 * state at wake time flips to a "hungover" prediction. Considers both peak
 * BAC during the session and residual BAC at wake time.
 */
export function drinksUntilHangover(
  inputs: BacInputs,
  sessionEndsAt: number,
  wakeAtMs: number,
  averageDrinkSize: number = 1.4,
  peakCap: number = HANGOVER_PEAK_MODERATE
): number {
  let count = 0;
  const drinks = [...inputs.drinks];
  const remainingMs = Math.max(0, sessionEndsAt - inputs.at);
  if (remainingMs === 0) return 0;
  const slotMs = 30 * 60_000;
  const slots = Math.max(1, Math.floor(remainingMs / slotMs));

  for (let i = 0; i < slots; i++) {
    const candidateAt = inputs.at + i * slotMs;
    const trial: DrinkEntry[] = [
      ...drinks,
      {
        id: `probe-${i}`,
        type: 'custom',
        label: 'probe',
        standardDrinks: averageDrinkSize,
        at: candidateAt,
      },
    ];
    const peak = peakBacInWindow(
      inputs.profile,
      trial,
      inputs.food,
      inputs.at,
      Math.max(sessionEndsAt + 90 * 60_000, wakeAtMs)
    );
    const bacAtWake = computeBacAt(
      { profile: inputs.profile, drinks: trial, food: inputs.food, at: wakeAtMs },
      BETA_TYPICAL
    );
    if (peak > peakCap) break;
    if (bacAtWake >= HANGOVER_WAKE_STILL_DRUNK) break;
    drinks.push(trial[trial.length - 1]);
    count += 1;
  }
  return count;
}

export function waterDeficit(drinks: DrinkEntry[], waterCount: number): number {
  return Math.max(0, drinks.length - 1 - waterCount);
}

export function peakBacInWindow(
  profile: Profile,
  drinks: DrinkEntry[],
  food: FoodEntry[],
  fromMs: number,
  toMs: number
): number {
  if (drinks.length === 0) return 0;
  const stepMs = 5 * 60_000;
  let peak = 0;
  for (let t = fromMs; t <= toMs; t += stepMs) {
    const v = computeBacAt({ profile, drinks, food, at: t }, BETA_TYPICAL);
    if (v > peak) peak = v;
  }
  return peak;
}
