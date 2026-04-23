import type {
  DrinkingFrequency,
  HydrationHabit,
  MorningFeel,
  PersonalBaseline,
  SleepQuality,
  TypicalDrinksBand,
} from '@/types';

const STARTING_RECOVERY_SCORE = 0.6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function drinks7dSumForFrequency(frequency: DrinkingFrequency): number {
  switch (frequency) {
    case 'rarely':
      return 2;
    case 'one_two_nights':
      return 8;
    case 'three_four_nights':
      return 16;
    case 'most_days':
    default:
      return 28;
  }
}

export function typicalDrinksForBand(typicalDrinks: TypicalDrinksBand): number {
  switch (typicalDrinks) {
    case 'two_three':
      return 3;
    case 'four_six':
      return 5;
    case 'seven_ten':
      return 8;
    case 'ten_plus':
    default:
      return 11;
  }
}

export function expectedHoursForBand(typicalDrinks: TypicalDrinksBand): number {
  switch (typicalDrinks) {
    case 'two_three':
      return 3;
    case 'four_six':
      return 4;
    case 'seven_ten':
      return 5;
    case 'ten_plus':
    default:
      return 6;
  }
}

export function sensitivityForMorningFeel(morningFeel: MorningFeel): number {
  switch (morningFeel) {
    case 'fine':
      return 0.8;
    case 'slightly_off':
      return 1;
    case 'pretty_rough':
      return 1.25;
    case 'ruined':
    default:
      return 1.5;
  }
}

export function sleepScoreForQuality(sleepQuality: SleepQuality): number {
  switch (sleepQuality) {
    case 'great':
      return 0.9;
    case 'okay':
      return 0.7;
    case 'poor':
    default:
      return 0.5;
  }
}

export function hydrationScoreForHabit(hydrationHabit: HydrationHabit): number {
  switch (hydrationHabit) {
    case 'under_1l':
      return 0.4;
    case 'one_two_l':
      return 0.6;
    case 'two_three_l':
      return 0.8;
    case 'three_plus_l':
    default:
      return 1;
  }
}

export function frequencyLabel(frequency: DrinkingFrequency): string {
  switch (frequency) {
    case 'rarely':
      return 'rarely';
    case 'one_two_nights':
      return '1–2 nights a week';
    case 'three_four_nights':
      return '3–4 nights a week';
    case 'most_days':
    default:
      return 'most days';
  }
}

export function typicalDrinksLabel(typicalDrinks: TypicalDrinksBand): string {
  switch (typicalDrinks) {
    case 'two_three':
      return '2–3 drinks';
    case 'four_six':
      return '4–6 drinks';
    case 'seven_ten':
      return '7–10 drinks';
    case 'ten_plus':
    default:
      return '10+ drinks';
  }
}

export function morningFeelLabel(morningFeel: MorningFeel): string {
  switch (morningFeel) {
    case 'fine':
      return 'usually fine';
    case 'slightly_off':
      return 'slightly off';
    case 'pretty_rough':
      return 'pretty rough';
    case 'ruined':
    default:
      return 'ruined';
  }
}

export function sleepQualityLabel(sleepQuality: SleepQuality): string {
  switch (sleepQuality) {
    case 'great':
      return 'great sleep';
    case 'okay':
      return 'okay sleep';
    case 'poor':
    default:
      return 'poor sleep';
  }
}

export function hydrationHabitLabel(hydrationHabit: HydrationHabit): string {
  switch (hydrationHabit) {
    case 'under_1l':
      return '<1L water';
    case 'one_two_l':
      return '1–2L water';
    case 'two_three_l':
      return '2–3L water';
    case 'three_plus_l':
    default:
      return '3L+ water';
  }
}

export type BaselineModel = {
  hydrationScore: number;
  sleepScore: number;
  recoveryScore: number;
  drinks7dSum: number;
  alcoholLoadScore: number;
  readinessScore: number;
  sensitivity: number;
  typicalDrinks: number;
  expectedHours: number;
  easyMorningLine: number;
  topFactors: string[];
};

export function buildBaselineModel(
  baseline: PersonalBaseline | undefined | null,
): BaselineModel | null {
  if (!baseline) return null;

  const hydrationScore = hydrationScoreForHabit(baseline.hydrationHabit);
  const sleepScore = sleepScoreForQuality(baseline.sleepQuality);
  const drinks7dSum = drinks7dSumForFrequency(baseline.frequency);
  const alcoholLoadScore = clamp(drinks7dSum / 40, 0, 1);
  const sensitivity = sensitivityForMorningFeel(baseline.morningFeel);
  const typicalDrinks = typicalDrinksForBand(baseline.typicalDrinks);
  const expectedHours = expectedHoursForBand(baseline.typicalDrinks);
  const readinessScore = Math.round(
    clamp(
      100 *
        (0.35 * hydrationScore +
          0.25 * sleepScore +
          0.25 * STARTING_RECOVERY_SCORE +
          0.15 * (1 - alcoholLoadScore)),
      0,
      100,
    ),
  );
  const easyMorningLine = clamp(
    Math.round((6 * (readinessScore / 100)) / sensitivity),
    2,
    8,
  );

  const rankedFactors = [
    { label: 'low hydration', severity: 1 - hydrationScore },
    { label: 'poor sleep', severity: 1 - sleepScore },
    { label: 'recent drinking load', severity: alcoholLoadScore },
  ]
    .sort((a, b) => b.severity - a.severity)
    .filter((factor) => factor.severity > 0.18);

  const topFactors = rankedFactors.slice(0, 2).map((factor) => factor.label);
  while (topFactors.length < 2) {
    topFactors.push(topFactors.length === 0 ? 'poor sleep' : 'low hydration');
  }

  return {
    hydrationScore,
    sleepScore,
    recoveryScore: STARTING_RECOVERY_SCORE,
    drinks7dSum,
    alcoholLoadScore,
    readinessScore,
    sensitivity,
    typicalDrinks,
    expectedHours,
    easyMorningLine,
    topFactors,
  };
}

export function personalizedEasyMorningLine(
  baseline: PersonalBaseline | undefined | null,
  plannerCap: number,
  readinessScore: number | null,
): number {
  if (!baseline) return plannerCap;
  const model = buildBaselineModel(baseline);
  if (!model) return plannerCap;
  const effectiveReadiness = readinessScore ?? model.readinessScore;
  const lineBySensitivity = clamp(
    Math.round((6 * (effectiveReadiness / 100)) / model.sensitivity),
    2,
    8,
  );
  return Math.max(1, Math.min(plannerCap, lineBySensitivity));
}
