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
const HOUR_MS = 60 * 60 * 1000;
export const INACTIVE_SESSION_MS = 2 * HOUR_MS;

export function lastSessionActivityAt(session: Session): number {
  const activity = [
    session.startedAt,
    session.plannedStartMs ?? 0,
    ...session.drinks.map((entry) => entry.at),
    ...session.food.map((entry) => entry.at),
    ...session.water.map((entry) => entry.at),
  ];
  return Math.max(...activity);
}

export function inactiveSessionEndAt(
  session: Session,
  now: number = Date.now(),
): number | null {
  const lastActivityAt = lastSessionActivityAt(session);
  if (now - lastActivityAt < INACTIVE_SESSION_MS) return null;
  return lastActivityAt + INACTIVE_SESSION_MS;
}

function startOfLocalDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function shouldShowMorningRecap(
  session: Session,
  now: number = Date.now(),
): boolean {
  if (session.recap) return false;
  if (!session.endedAt) return false;
  return startOfLocalDay(now) > startOfLocalDay(session.endedAt);
}

type SessionState = {
  active: Session | null;
  history: Session[];
  now: number;
  justEndedId: string | null;
  startSession: (
    expectedHours: number,
    opts?: {
      wakeAtMs?: number;
      planToDrive?: boolean;
      plannedStartMs?: number;
      plannedDrinkCap?: number;
    },
  ) => void;
  endSession: (peakBac: number, predictedRisk?: HangoverRisk) => string | null;
  endSessionAt: (
    endedAt: number,
    peakBac: number,
    predictedRisk?: HangoverRisk,
    opts?: {
      autoEnded?: boolean;
      peakBacAt?: number;
      estimatedUnderLimitAt?: number | null;
      estimatedSoberAt?: number | null;
    },
  ) => string | null;
  cancelSession: () => void;
  clearJustEnded: () => void;
  setExpectedHours: (h: number) => void;
  setWakeAt: (ms: number | undefined) => void;
  setPlanToDrive: (v: boolean) => void;
  setPlannedStartAt: (ms: number | undefined) => void;
  markCapBreachAttempt: () => void;
  togglePrepDone: (id: string) => void;
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
      justEndedId: null,

      startSession: (expectedHours, opts) => {
        const session: Session = {
          id: nanoid(),
          startedAt: Date.now(),
          expectedHours,
          plannedDrinkCap: opts?.plannedDrinkCap,
          drinks: [],
          food: [],
          water: [],
          capBreachAttempts: 0,
          wakeAtMs: opts?.wakeAtMs,
          planToDrive: opts?.planToDrive ?? false,
          plannedStartMs: opts?.plannedStartMs,
          prepDone: [],
        };
        set({ active: session, now: Date.now() });
      },

      endSession: (peakBac, predictedRisk) =>
        get().endSessionAt(Date.now(), peakBac, predictedRisk),

      endSessionAt: (endedAt, peakBac, predictedRisk, opts) => {
        const { active, history } = get();
        if (!active) return null;
        const ended: Session = {
          ...active,
          endedAt,
          peakBac,
          peakBacAt: opts?.peakBacAt,
          estimatedUnderLimitAt: opts?.estimatedUnderLimitAt ?? undefined,
          estimatedSoberAt: opts?.estimatedSoberAt ?? undefined,
          predictedRisk,
          autoEnded: opts?.autoEnded,
        };
        const next = [ended, ...history].slice(0, HISTORY_LIMIT);
        set({ active: null, history: next, justEndedId: ended.id });
        return ended.id;
      },

      cancelSession: () => set({ active: null }),

      clearJustEnded: () => set({ justEndedId: null }),

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

      setPlannedStartAt: (ms) => {
        const { active } = get();
        if (!active) return;
        set({ active: { ...active, plannedStartMs: ms } });
      },

      markCapBreachAttempt: () => {
        const { active } = get();
        if (!active) return;
        set({
          active: {
            ...active,
            capBreachAttempts: (active.capBreachAttempts ?? 0) + 1,
          },
        });
      },

      togglePrepDone: (id) => {
        const { active } = get();
        if (!active) return;
        const done = active.prepDone ?? [];
        const next = done.includes(id)
          ? done.filter((x) => x !== id)
          : [...done, id];
        set({ active: { ...active, prepDone: next } });
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
          active: {
            ...active,
            drinks: [...active.drinks, entry],
            firstDrinkAt: active.firstDrinkAt ?? entry.at,
            lastDrinkAt: entry.at,
          },
          now: Date.now(),
        });
      },

      removeDrink: (id) => {
        const { active } = get();
        if (!active) return;
        const drinks = active.drinks.filter((d) => d.id !== id);
        const sorted = [...drinks].sort((a, b) => a.at - b.at);
        set({
          active: {
            ...active,
            drinks,
            firstDrinkAt: sorted[0]?.at,
            lastDrinkAt: sorted[sorted.length - 1]?.at,
          },
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
        const pending = history.find((s) => shouldShowMorningRecap(s, now));
        return pending?.id ?? null;
      },

      tickNow: () => set({ now: Date.now() }),

      clearHistory: () => set({ history: [], justEndedId: null }),
    }),
    {
      name: 'hangover-buddy:session',
      partialize: (state) => ({ active: state.active, history: state.history }),
    }
  )
);
