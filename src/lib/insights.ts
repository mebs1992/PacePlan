import type { DrinkType, Session, Symptom } from '@/types';
import { DRINK_PRESETS } from './drinks';
import { hasDrinkCap, drinksOverCap, isWithinDrinkCap } from './drinkCap';
import { waterDeficit } from './bac';

export type EndedSession = Session & { endedAt: number };

export type Aggregates = {
  totalNights: number;
  totalWithRecap: number;
  avgPeakBac: number | null;
  avgRating: number | null;
  avgStdDrinks: number | null;
};

export type MorningBucket = {
  count: number;
  avgPeakBac: number;
  avgStdDrinks: number;
  avgWaterDeficit: number;
  mealRate: number;
};

export type MorningComparison = {
  rough: MorningBucket | null;
  good: MorningBucket | null;
};

export type SymptomStat = {
  key: Symptom;
  label: string;
  count: number;
  pct: number;
};

export type HelperImpact = {
  label: string;
  withCount: number;
  withoutCount: number;
  withAvgRating: number;
  withoutAvgRating: number;
  delta: number;
};

export type DrinkTypeStat = {
  type: DrinkType;
  label: string;
  sessionCount: number;
  avgRating: number;
};

export type CapAdherence = {
  totalWithCap: number;
  withinCapCount: number;
  exceededCapCount: number;
  withinCapRate: number | null;
  avgOverBy: number | null;
};

const SYMPTOM_LABEL: Record<Symptom, string> = {
  headache: 'Headache',
  nausea: 'Nausea',
  tired: 'Tired',
  queasy: 'Queasy',
  dehydrated: 'Dehydrated',
  anxious: 'Anxious',
  poor_sleep: 'Poor sleep',
  brain_fog: 'Brain fog',
  sore_stomach: 'Sore stomach',
  fine: 'Fine',
};

const DRINK_LABEL: Record<DrinkType, string> = {
  mid_beer: 'Mid beer',
  full_beer: 'Full beer',
  wine: 'Wine',
  spirit: 'Spirit',
  cocktail: 'Cocktail',
  custom: 'Custom',
  ...Object.fromEntries(DRINK_PRESETS.map((p) => [p.type, p.label])),
} as Record<DrinkType, string>;

function totalStd(s: Session): number {
  return s.drinks.reduce((sum, d) => sum + d.standardDrinks, 0);
}

function hasMeal(s: Session): boolean {
  return s.food.some((f) => f.size === 'meal');
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function endedSessions(history: Session[]): EndedSession[] {
  return history.filter((s): s is EndedSession => typeof s.endedAt === 'number');
}

export function recappedSessions(history: Session[]): EndedSession[] {
  return endedSessions(history).filter((s) => s.recap !== undefined);
}

export function computeAggregates(history: Session[]): Aggregates {
  const ended = endedSessions(history);
  const recapped = ended.filter((s) => s.recap);
  return {
    totalNights: ended.length,
    totalWithRecap: recapped.length,
    avgPeakBac: ended.length ? avg(ended.map((s) => s.peakBac ?? 0)) : null,
    avgRating: recapped.length
      ? avg(recapped.map((s) => s.recap!.rating))
      : null,
    avgStdDrinks: ended.length ? avg(ended.map(totalStd)) : null,
  };
}

export function capAdherence(history: Session[]): CapAdherence {
  const withCap = endedSessions(history).filter((s) => hasDrinkCap(s));
  const withinCap = withCap.filter((s) => isWithinDrinkCap(s) === true);
  const exceeded = withCap.filter((s) => isWithinDrinkCap(s) === false);
  return {
    totalWithCap: withCap.length,
    withinCapCount: withinCap.length,
    exceededCapCount: exceeded.length,
    withinCapRate: withCap.length ? withinCap.length / withCap.length : null,
    avgOverBy: exceeded.length
      ? avg(exceeded.map((s) => drinksOverCap(s) ?? 0))
      : null,
  };
}

function bucketStats(sessions: EndedSession[]): MorningBucket | null {
  if (sessions.length === 0) return null;
  return {
    count: sessions.length,
    avgPeakBac: avg(sessions.map((s) => s.peakBac ?? 0)),
    avgStdDrinks: avg(sessions.map(totalStd)),
    avgWaterDeficit: avg(sessions.map((s) => waterDeficit(s.drinks, s.water.length))),
    mealRate: avg(sessions.map((s) => (hasMeal(s) ? 1 : 0))),
  };
}

export function compareMornings(history: Session[]): MorningComparison {
  const recapped = recappedSessions(history);
  const rough = recapped.filter((s) => (s.recap!.rating as number) <= 2);
  const good = recapped.filter((s) => (s.recap!.rating as number) >= 4);
  return {
    rough: bucketStats(rough),
    good: bucketStats(good),
  };
}

export function topSymptoms(history: Session[], limit = 3): SymptomStat[] {
  const recapped = recappedSessions(history);
  if (recapped.length === 0) return [];
  const counts = new Map<Symptom, number>();
  for (const s of recapped) {
    for (const sym of s.recap!.symptoms) {
      counts.set(sym, (counts.get(sym) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([key]) => key !== 'fine')
    .map(([key, count]) => ({
      key,
      label: SYMPTOM_LABEL[key],
      count,
      pct: count / recapped.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function helperImpact(
  sessions: EndedSession[],
  predicate: (s: EndedSession) => boolean,
  label: string,
  minPerBucket = 2
): HelperImpact | null {
  const withGroup = sessions.filter(predicate);
  const withoutGroup = sessions.filter((s) => !predicate(s));
  if (withGroup.length < minPerBucket || withoutGroup.length < minPerBucket) {
    return null;
  }
  const withAvg = avg(withGroup.map((s) => s.recap!.rating));
  const withoutAvg = avg(withoutGroup.map((s) => s.recap!.rating));
  return {
    label,
    withCount: withGroup.length,
    withoutCount: withoutGroup.length,
    withAvgRating: withAvg,
    withoutAvgRating: withoutAvg,
    delta: withAvg - withoutAvg,
  };
}

export function helperImpacts(history: Session[]): HelperImpact[] {
  const recapped = recappedSessions(history);
  const results: HelperImpact[] = [];
  const meal = helperImpact(recapped, hasMeal, 'Eating a meal');
  if (meal) results.push(meal);
  const hydrated = helperImpact(
    recapped,
    (s) => waterDeficit(s.drinks, s.water.length) === 0,
    'Staying on water'
  );
  if (hydrated) results.push(hydrated);
  return results;
}

export function drinkTypeImpacts(history: Session[], minCount = 2): DrinkTypeStat[] {
  const recapped = recappedSessions(history);
  if (recapped.length === 0) return [];
  const byType = new Map<DrinkType, number[]>();
  for (const s of recapped) {
    const types = new Set(s.drinks.map((d) => d.type));
    for (const t of types) {
      const arr = byType.get(t) ?? [];
      arr.push(s.recap!.rating);
      byType.set(t, arr);
    }
  }
  return Array.from(byType.entries())
    .filter(([, ratings]) => ratings.length >= minCount)
    .map(([type, ratings]) => ({
      type,
      label: DRINK_LABEL[type] ?? type,
      sessionCount: ratings.length,
      avgRating: avg(ratings),
    }))
    .sort((a, b) => a.avgRating - b.avgRating);
}
