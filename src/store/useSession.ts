import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  DrinkEntry,
  DrinkType,
  FoodEntry,
  FoodSize,
  Session,
  WaterEntry,
} from '@/types';

const HISTORY_LIMIT = 5;

type SessionState = {
  active: Session | null;
  history: Session[];
  now: number;
  startSession: (expectedHours: number) => void;
  endSession: (peakBac: number) => void;
  setExpectedHours: (h: number) => void;
  addDrink: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
  removeDrink: (id: string) => void;
  addFood: (size: FoodSize) => void;
  removeFood: (id: string) => void;
  addWater: () => void;
  removeWater: (id: string) => void;
  tickNow: () => void;
  clearHistory: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],
      now: Date.now(),

      startSession: (expectedHours) => {
        const session: Session = {
          id: nanoid(),
          startedAt: Date.now(),
          expectedHours,
          drinks: [],
          food: [],
          water: [],
        };
        set({ active: session, now: Date.now() });
      },

      endSession: (peakBac) => {
        const { active, history } = get();
        if (!active) return;
        const ended: Session = { ...active, endedAt: Date.now(), peakBac };
        const next = [ended, ...history].slice(0, HISTORY_LIMIT);
        set({ active: null, history: next });
      },

      setExpectedHours: (h) => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, expectedHours: h } });
      },

      addDrink: ({ type, label, standardDrinks }) => {
        const { active } = get();
        if (!active) return;
        const entry: DrinkEntry = {
          id: nanoid(),
          type,
          label,
          standardDrinks,
          at: Date.now(),
        };
        set({
          active: { ...active, drinks: [...active.drinks, entry] },
          now: Date.now(),
        });
      },

      removeDrink: (id) => {
        const { active } = get();
        if (!active) return;
        set({
          active: { ...active, drinks: active.drinks.filter((d) => d.id !== id) },
        });
      },

      addFood: (size) => {
        const { active } = get();
        if (!active) return;
        const entry: FoodEntry = { id: nanoid(), size, at: Date.now() };
        set({ active: { ...active, food: [...active.food, entry] } });
      },

      removeFood: (id) => {
        const { active } = get();
        if (!active) return;
        set({
          active: { ...active, food: active.food.filter((f) => f.id !== id) },
        });
      },

      addWater: () => {
        const { active } = get();
        if (!active) return;
        const entry: WaterEntry = { id: nanoid(), at: Date.now() };
        set({ active: { ...active, water: [...active.water, entry] } });
      },

      removeWater: (id) => {
        const { active } = get();
        if (!active) return;
        set({
          active: { ...active, water: active.water.filter((w) => w.id !== id) },
        });
      },

      tickNow: () => set({ now: Date.now() }),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'hangover-buddy:session',
      partialize: (state) => ({ active: state.active, history: state.history }),
    }
  )
);
