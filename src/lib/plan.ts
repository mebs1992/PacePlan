import type { DrinkEntry, FoodEntry, Profile } from '@/types';
import {
  BETA_TYPICAL,
  computeBacAt,
  peakBacInWindow,
  suggestedDrinksRemaining,
} from './bac';

const HOUR_MS = 60 * 60 * 1000;
const AVG_DRINK_STD = 1.4;
const SOBER_THRESHOLD = 0.005;

export type PlanInputs = {
  profile: Profile;
  plannedStartMs: number;
  expectedHours: number;
  wakeAtMs?: number;
  driving: boolean;
};

export type NightPlan = {
  drinksCap: number;
  minutesPerDrink: number | null;
  peakBac: number;
  lastCallMs: number | null;
  plannedEndMs: number;
  driving: boolean;
  peakCap: number;
};

export function buildDrinkTargetOptions(
  suggestedCap: number,
  plannerCap: number,
  maxOptions = 4,
): number[] {
  const safePlannerCap = Math.max(0, Math.round(plannerCap));
  const safeSuggestedCap = Math.max(
    0,
    Math.min(safePlannerCap, Math.round(suggestedCap)),
  );
  const limit = Math.min(maxOptions, safePlannerCap + 1);

  if (safePlannerCap === 0) return [0];

  const selected = new Set<number>([safeSuggestedCap, safePlannerCap]);
  const priority = [
    safeSuggestedCap - 1,
    safeSuggestedCap + 1,
    0,
    safeSuggestedCap - 2,
    safeSuggestedCap + 2,
    safePlannerCap - 1,
    1,
  ];

  for (const candidate of priority) {
    if (
      selected.size < limit &&
      candidate >= 0 &&
      candidate <= safePlannerCap
    ) {
      selected.add(candidate);
    }
  }

  return Array.from(selected).sort((a, b) => a - b);
}

function plannedMeal(plannedStartMs: number): FoodEntry {
  return {
    id: 'plan-meal',
    size: 'meal',
    at: plannedStartMs - 30 * 60_000,
  };
}

function scheduledDrinks(
  plannedStartMs: number,
  lastDrinkAt: number,
  count: number
): DrinkEntry[] {
  const drinks: DrinkEntry[] = [];
  if (count <= 0) return drinks;
  const span = Math.max(0, lastDrinkAt - plannedStartMs);
  const interval = count > 1 ? span / (count - 1) : 0;
  for (let i = 0; i < count; i++) {
    drinks.push({
      id: `plan-d-${i}`,
      type: 'custom',
      label: 'plan',
      standardDrinks: AVG_DRINK_STD,
      at: plannedStartMs + i * interval,
    });
  }
  return drinks;
}

function findLastCall(
  profile: Profile,
  plannedStartMs: number,
  plannedEndMs: number,
  wakeAtMs: number,
  drinksCap: number
): number | null {
  if (drinksCap <= 0) return null;
  const food = [plannedMeal(plannedStartMs)];
  const stepMs = 15 * 60_000;
  for (let lastAt = plannedEndMs; lastAt >= plannedStartMs; lastAt -= stepMs) {
    const drinks = scheduledDrinks(plannedStartMs, lastAt, drinksCap);
    const bacAtWake = computeBacAt(
      { profile, drinks, food, at: wakeAtMs },
      BETA_TYPICAL
    );
    if (bacAtWake <= SOBER_THRESHOLD) return lastAt;
  }
  return null;
}

export function planNight(inputs: PlanInputs): NightPlan {
  const { profile, plannedStartMs, expectedHours, wakeAtMs, driving } = inputs;
  const plannedEndMs = plannedStartMs + expectedHours * HOUR_MS;
  const peakCap = driving ? 0.045 : 0.055;

  const drinksCap = suggestedDrinksRemaining(
    {
      profile,
      drinks: [],
      food: [plannedMeal(plannedStartMs)],
      at: plannedStartMs,
    },
    plannedEndMs,
    AVG_DRINK_STD,
    peakCap
  );

  const minutesPerDrink =
    drinksCap > 0 ? Math.round((expectedHours * 60) / drinksCap) : null;

  const peakBac =
    drinksCap > 0
      ? peakBacInWindow(
          profile,
          scheduledDrinks(plannedStartMs, plannedEndMs, drinksCap),
          [plannedMeal(plannedStartMs)],
          plannedStartMs,
          plannedEndMs + 90 * 60_000
        )
      : 0;

  const lastCallMs =
    wakeAtMs !== undefined
      ? findLastCall(profile, plannedStartMs, plannedEndMs, wakeAtMs, drinksCap)
      : null;

  return {
    drinksCap,
    minutesPerDrink,
    peakBac,
    lastCallMs,
    plannedEndMs,
    driving,
    peakCap,
  };
}
