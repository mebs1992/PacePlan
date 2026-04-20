export type TipStatus = 'active' | 'urgent' | 'overdue' | 'done';

export type TipIcon =
  | 'meal'
  | 'snack'
  | 'water'
  | 'ride'
  | 'phone'
  | 'friend'
  | 'cap'
  | 'electrolyte'
  | 'pace';

export type PrepTip = {
  id: string;
  title: string;
  detail: string;
  urgentDetail?: string;
  overdueDetail?: string;
  icon: TipIcon;
  /** Minutes before planned start when this tip first appears in the list. */
  appearsAtMin: number;
  /** Minutes before planned start when the tip flips to 'urgent'. */
  urgentAtMin: number;
  /** Minutes before planned start after which the tip is 'overdue'. */
  dueByMin: number;
  /** If true, logging a meal auto-marks this done. */
  autoDoneByMeal?: boolean;
  /** If true, logging any water auto-marks this done. */
  autoDoneByWater?: boolean;
  /** If true, hide this tip entirely when a meal has already been logged. */
  hideIfMealLogged?: boolean;
};

/**
 * Ordered roughly by how far out they become relevant. Times are in minutes
 * before the planned drink start.
 *
 * appearsAtMin → shown in the list
 * urgentAtMin  → red-ish "soon" badge
 * dueByMin     → past this, it's overdue / show recovery copy
 */
export const PREP_TIPS: PrepTip[] = [
  {
    id: 'meal',
    title: 'Eat a full meal',
    detail: 'Carbs + protein slow absorption and flatten your peak BAC.',
    urgentDetail: 'Eat now — sitting down to a real meal still helps.',
    overdueDetail: 'Grab a carb-heavy snack before the first drink.',
    icon: 'meal',
    appearsAtMin: 360,
    urgentAtMin: 90,
    dueByMin: 30,
    autoDoneByMeal: true,
  },
  {
    id: 'hydrate',
    title: 'Drink 500ml water',
    detail: 'Start the night properly hydrated.',
    urgentDetail: 'One big glass before you leave.',
    overdueDetail: 'Chase your first drink with a full glass of water.',
    icon: 'water',
    appearsAtMin: 240,
    urgentAtMin: 45,
    dueByMin: 10,
    autoDoneByWater: true,
  },
  {
    id: 'ride',
    title: 'Plan your ride home',
    detail: 'Save a cab number or pre-book a rideshare.',
    urgentDetail: 'Lock in your ride before the first drink.',
    overdueDetail: 'Do not drive. Use a rideshare or taxi.',
    icon: 'ride',
    appearsAtMin: 180,
    urgentAtMin: 60,
    dueByMin: 0,
  },
  {
    id: 'friend',
    title: 'Tell someone your plans',
    detail: 'Who you’re with and when you’ll be home.',
    urgentDetail: 'Send a quick text — location + ETA.',
    overdueDetail: 'Share your location with a friend now.',
    icon: 'friend',
    appearsAtMin: 120,
    urgentAtMin: 45,
    dueByMin: 10,
  },
  {
    id: 'cap',
    title: 'Set a drink cap',
    detail: 'Decide a number now, before you’re buzzed.',
    urgentDetail: 'Pick a hard limit and stick to it.',
    overdueDetail: 'Commit to a cap on the way in.',
    icon: 'cap',
    appearsAtMin: 120,
    urgentAtMin: 30,
    dueByMin: 0,
  },
  {
    id: 'electrolyte',
    title: 'Electrolyte drink or salty food',
    detail: 'Topping up sodium/potassium cushions the hangover.',
    urgentDetail: 'Sports drink, pickle juice, salty snack — anything counts.',
    overdueDetail: 'Order something salty with your first round.',
    icon: 'electrolyte',
    appearsAtMin: 90,
    urgentAtMin: 30,
    dueByMin: 0,
  },
  {
    id: 'phone',
    title: 'Charge your phone',
    detail: 'Aim for 100% — you’ll want it later.',
    urgentDetail: 'Top up now. Even 30 minutes helps.',
    overdueDetail: 'Bring a cable or power bank.',
    icon: 'phone',
    appearsAtMin: 60,
    urgentAtMin: 25,
    dueByMin: 5,
  },
  {
    id: 'snack-now',
    title: 'Have a carb snack',
    detail: 'You haven’t eaten a meal — grab toast, crackers, anything.',
    urgentDetail: 'Last-minute carbs still help.',
    overdueDetail: 'First drink with food in your stomach, not on top.',
    icon: 'snack',
    appearsAtMin: 45,
    urgentAtMin: 20,
    dueByMin: 0,
    hideIfMealLogged: true,
  },
];

export type StatusedTip = PrepTip & {
  status: TipStatus;
  displayDetail: string;
};

export type PrepContext = {
  minutesUntilStart: number;
  mealLogged: boolean;
  waterLoggedCount: number;
  completedIds: string[];
};

const STATUS_RANK: Record<TipStatus, number> = {
  overdue: 0,
  urgent: 1,
  active: 2,
  done: 3,
};

export function getActiveTips(ctx: PrepContext): StatusedTip[] {
  const { minutesUntilStart, mealLogged, waterLoggedCount, completedIds } = ctx;
  const done = new Set(completedIds);

  return PREP_TIPS.filter((t) => minutesUntilStart <= t.appearsAtMin)
    .filter((t) => !(t.hideIfMealLogged && mealLogged))
    .map<StatusedTip>((t) => {
      const autoDone =
        (t.autoDoneByMeal && mealLogged) ||
        (t.autoDoneByWater && waterLoggedCount >= 1);

      let status: TipStatus;
      if (autoDone || done.has(t.id)) status = 'done';
      else if (minutesUntilStart <= t.dueByMin) status = 'overdue';
      else if (minutesUntilStart <= t.urgentAtMin) status = 'urgent';
      else status = 'active';

      const displayDetail =
        status === 'overdue' && t.overdueDetail
          ? t.overdueDetail
          : status === 'urgent' && t.urgentDetail
            ? t.urgentDetail
            : t.detail;

      return { ...t, status, displayDetail };
    })
    .sort((a, b) => {
      const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (r !== 0) return r;
      return a.dueByMin - b.dueByMin;
    });
}

/**
 * A short banner headline for the pre-session view, keyed off how close
 * we are to the planned drink start.
 */
export function countdownHeadline(minutesUntilStart: number): string {
  if (minutesUntilStart <= 0) return 'Time to start.';
  if (minutesUntilStart <= 5) return 'Any moment now.';
  if (minutesUntilStart <= 15) return 'Final checks.';
  if (minutesUntilStart <= 45) return 'Home stretch.';
  if (minutesUntilStart <= 120) return 'Get ready.';
  return 'Plan ahead.';
}
