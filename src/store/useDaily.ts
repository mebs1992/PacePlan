import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DailyFoodStatus } from '@/types';

type DailyState = {
  hydrationByDay: Record<string, number>;
  sleepByDay: Record<string, number>;
  foodByDay: Record<string, DailyFoodStatus>;
  addHydration: (glasses?: number, atMs?: number) => void;
  removeHydration: (glasses?: number, atMs?: number) => void;
  setHydration: (glasses: number, atMs?: number) => void;
  addSleep: (hours?: number, atMs?: number) => void;
  removeSleep: (hours?: number, atMs?: number) => void;
  setSleep: (hours: number, atMs?: number) => void;
  setFood: (status: DailyFoodStatus, atMs?: number) => void;
  clearFood: (atMs?: number) => void;
  clearAll: () => void;
};

function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const useDaily = create<DailyState>()(
  persist(
    (set) => ({
      hydrationByDay: {},
      sleepByDay: {},
      foodByDay: {},
      addHydration: (glasses = 1, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          return {
            hydrationByDay: {
              ...state.hydrationByDay,
              [key]: (state.hydrationByDay[key] ?? 0) + glasses,
            },
          };
        }),
      removeHydration: (glasses = 1, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          const next = Math.max(0, (state.hydrationByDay[key] ?? 0) - glasses);
          return {
            hydrationByDay: {
              ...state.hydrationByDay,
              [key]: next,
            },
          };
        }),
      setHydration: (glasses, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          return {
            hydrationByDay: {
              ...state.hydrationByDay,
              [key]: Math.max(0, glasses),
            },
          };
        }),
      addSleep: (hours = 1, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          return {
            sleepByDay: {
              ...state.sleepByDay,
              [key]: (state.sleepByDay[key] ?? 0) + hours,
            },
          };
        }),
      removeSleep: (hours = 1, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          const next = Math.max(0, (state.sleepByDay[key] ?? 0) - hours);
          return {
            sleepByDay: {
              ...state.sleepByDay,
              [key]: next,
            },
          };
        }),
      setSleep: (hours, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          return {
            sleepByDay: {
              ...state.sleepByDay,
              [key]: Math.max(0, hours),
            },
          };
        }),
      setFood: (status, atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          return {
            foodByDay: {
              ...state.foodByDay,
              [key]: status,
            },
          };
        }),
      clearFood: (atMs = Date.now()) =>
        set((state) => {
          const key = dayKey(atMs);
          const foodByDay = { ...state.foodByDay };
          delete foodByDay[key];
          return { foodByDay };
        }),
      clearAll: () =>
        set({
          hydrationByDay: {},
          sleepByDay: {},
          foodByDay: {},
        }),
    }),
    { name: 'hangover-buddy:daily' }
  )
);
