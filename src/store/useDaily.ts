import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type DailyState = {
  hydrationByDay: Record<string, number>;
  addHydration: (glasses?: number, atMs?: number) => void;
  removeHydration: (glasses?: number, atMs?: number) => void;
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
    }),
    { name: 'hangover-buddy:daily' }
  )
);
