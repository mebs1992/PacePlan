export type Sex = 'male' | 'female';

export type DrinkingFrequency =
  | 'rarely'
  | 'one_two_nights'
  | 'three_four_nights'
  | 'most_days';

export type TypicalDrinksBand =
  | 'two_three'
  | 'four_six'
  | 'seven_ten'
  | 'ten_plus';

export type MorningFeel =
  | 'fine'
  | 'slightly_off'
  | 'pretty_rough'
  | 'ruined';

export type SleepQuality = 'great' | 'okay' | 'poor';

export type HydrationHabit =
  | 'under_1l'
  | 'one_two_l'
  | 'two_three_l'
  | 'three_plus_l';

export type PersonalBaseline = {
  frequency: DrinkingFrequency;
  typicalDrinks: TypicalDrinksBand;
  morningFeel: MorningFeel;
  sleepQuality: SleepQuality;
  hydrationHabit: HydrationHabit;
  completedAt: number;
};

export type Profile = {
  name: string;
  sex: Sex;
  weightKg: number;
  heightCm?: number;
  age?: number;
  acceptedDisclaimerAt: number;
  baseline?: PersonalBaseline;
};

export type DrinkType =
  | 'mid_beer'
  | 'full_beer'
  | 'wine'
  | 'spirit'
  | 'cocktail'
  | 'custom';

export type DrinkEntry = {
  id: string;
  type: DrinkType;
  label: string;
  standardDrinks: number;
  at: number;
};

export type FoodSize = 'snack' | 'meal';

export type DailyFoodStatus = 'none' | 'light' | 'solid';

export type FoodEntry = {
  id: string;
  size: FoodSize;
  at: number;
};

export type WaterEntry = {
  id: string;
  at: number;
};

export type Symptom =
  | 'headache'
  | 'nausea'
  | 'tired'
  | 'queasy'
  | 'dehydrated'
  | 'anxious'
  | 'poor_sleep'
  | 'brain_fog'
  | 'sore_stomach'
  | 'fine';

export type HangoverRecap = {
  rating: 1 | 2 | 3 | 4 | 5;
  symptoms: Symptom[];
  note?: string;
  nightScore?: number;
  submittedAt: number;
};

export type BacSample = {
  at: number;
  bac: number;
  projectedPeak?: number;
  projectedSoberAt?: number;
};

export type Session = {
  id: string;
  startedAt: number;
  expectedHours: number;
  plannedDrinkCap?: number;
  endedAt?: number;
  drinks: DrinkEntry[];
  food: FoodEntry[];
  water: WaterEntry[];
  capBreachAttempts?: number;
  autoEnded?: boolean;
  firstDrinkAt?: number;
  lastDrinkAt?: number;
  peakBac?: number;
  peakBacAt?: number;
  estimatedUnderLimitAt?: number;
  estimatedSoberAt?: number;
  bacSamples?: BacSample[];
  predictedRisk?: HangoverRisk;
  wakeAtMs?: number;
  planToDrive?: boolean;
  recap?: HangoverRecap;
  /** When drinking is planned to start. If > startedAt and > now, the
   *  session is in pre-drinking mode. */
  plannedStartMs?: number;
  /** IDs of prep tips the user has manually ticked off during pre-drinking. */
  prepDone?: string[];
};

export type RiskLevel = 'green' | 'yellow' | 'red';

export type HangoverRisk = 'low' | 'moderate' | 'high' | 'severe';
