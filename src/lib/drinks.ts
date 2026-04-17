import type { DrinkType } from '@/types';

export const GRAMS_PER_STANDARD_DRINK_AU = 10;

export type DrinkPreset = {
  type: DrinkType;
  label: string;
  sublabel: string;
  standardDrinks: number;
};

export const DRINK_PRESETS: DrinkPreset[] = [
  { type: 'mid_beer', label: 'Mid beer', sublabel: '375 ml · 3.5%', standardDrinks: 1.0 },
  { type: 'full_beer', label: 'Full beer', sublabel: '375 ml · 4.8%', standardDrinks: 1.4 },
  { type: 'wine', label: 'Wine', sublabel: '150 ml · 13%', standardDrinks: 1.5 },
  { type: 'spirit', label: 'Spirit', sublabel: '30 ml · 40%', standardDrinks: 1.0 },
  { type: 'cocktail', label: 'Cocktail', sublabel: 'avg 2 standard', standardDrinks: 2.0 },
];
