import type { Session } from '@/types';

type SessionCapShape = Pick<Session, 'plannedDrinkCap' | 'drinks'>;

export function hasDrinkCap(session: Pick<Session, 'plannedDrinkCap'>): session is Pick<
  Session,
  'plannedDrinkCap'
> & {
  plannedDrinkCap: number;
} {
  return (
    typeof session.plannedDrinkCap === 'number' &&
    Number.isFinite(session.plannedDrinkCap) &&
    session.plannedDrinkCap >= 0
  );
}

export function drinkCapRemaining(session: SessionCapShape): number | null {
  if (!hasDrinkCap(session)) return null;
  return session.plannedDrinkCap - session.drinks.length;
}

export function drinksOverCap(session: SessionCapShape): number | null {
  const remaining = drinkCapRemaining(session);
  if (remaining === null) return null;
  return Math.max(0, -remaining);
}

export function isWithinDrinkCap(session: SessionCapShape): boolean | null {
  const remaining = drinkCapRemaining(session);
  if (remaining === null) return null;
  return remaining >= 0;
}
