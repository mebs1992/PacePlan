import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  DrinkEntry,
  DrinkType,
  FoodEntry,
  FoodSize,
  HangoverRecap,
  HangoverRisk,
  Session,
  WaterEntry,
} from '@/types';

const HISTORY_LIMIT = 20;

type SessionState = {
  active: Session | null;
  history: Session[];
  now: number;
  startSession: (expectedHours: number, opts?: { wakeAtMs?: number; planToDrive?: boolean }) => void;
  endSession: (peakBac: number, predictedRisk?: HangoverRisk) => string | null;
  setExpectedHours: (h: number) => void;
  setWakeAt: (ms: number | undefined) => void;
  setPlanToDrive: (v: boolean) => void;
  addDrink: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
  removeDrink: (id: string) => void;
  addFood: (size: FoodSize) => void;
  removeFood: (id: string) => void;
  addWater: () => void;
  removeWater: (id: string) => void;
  submitRecap: (sessionId: string, recap: HangoverRecap) => void;
  pendingRecapId: () => string | null;
  tickNow: () => void;
  clearHistory: () => void;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      active: null,
      history: [],
      now: Date.now(),

      startSession: (expectedHours, opts) => {
        const session: Session = {
          id: nanoid(),
          startedAt: Date.now(),
          expectedHours,
          drinks: [],
          food: [],
          water: [],
          wakeAtMs: opts?.wakeAtMs,
          planToDrive: opts?.planToDrive ?? false,
        };
        set({ active: session, now: Date.now() });
      },

      endSession: (peakBac, predictedRisk) => {
        const { active, history } = get();
        if (!active) return null;
        const ended: Session = {
          ...active,
          endedAt: Date.now(),
          peakBac,
          predictedRisk,
        };
        const next = [ended, ...history].slice(0, HISTORY_LIMIT);
        set({ active: null, history: next });
        return ended.id;
      },

      setExpectedHours: (h) => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, expectedHours: h } });
      },

      setWakeAt: (ms) => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, wakeAtMs: ms } });
      },

      setPlanToDrive: (v) => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, planToDrive: v } });
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

      submitRecap: (sessionId, recap) => {
        const { history } = get();
        set({
          history: history.map((s) =>
            s.id === sessionId ? { ...s, recap } : s
          ),
        });
      },

      pendingRecapId: () => {
        const { history } = get();
        const now = Date.now();
        const pending = history.find((s) => {
          if (s.recap) return false;
          if (!s.endedAt) return false;
          const wake = s.wakeAtMs ?? s.endedAt + 8 * 60 * 60 * 1000;
          return now >= wake;
        });
        return pending?.id ?? null;
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
