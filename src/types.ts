export type Sex = 'male' | 'female';

export type Profile = {
  name: string;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  age: number;
  acceptedDisclaimerAt: number;
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

export type FoodEntry = {
  id: string;
  size: FoodSize;
  at: number;
};

export type WaterEntry = {
  id: string;
  at: number;
};

export type Session = {
  id: string;
  startedAt: number;
  expectedHours: number;
  endedAt?: number;
  drinks: DrinkEntry[];
  food: FoodEntry[];
  water: WaterEntry[];
  peakBac?: number;
  wakeAtMs?: number;
  planToDrive?: boolean;
};

export type RiskLevel = 'green' | 'yellow' | 'red';

export type HangoverRisk = 'low' | 'moderate' | 'high' | 'severe';
