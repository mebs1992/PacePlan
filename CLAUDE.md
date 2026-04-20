# Hangover Buddy

A BAC tracker / drinking session companion. Single-page React app, no backend.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (editorial "paper" palette — see `tailwind.config.ts`)
- Zustand for state (with `persist` middleware → localStorage)
- framer-motion for animations
- lucide-react for icons
- nanoid for IDs
- PWA via `vite-plugin-pwa`
- Path alias: `@/*` → `src/*`

No routing library. Views are managed by a `useState<View>` in `App.tsx`
(`'session' | 'history' | 'settings'`). The `<BottomNav>` swaps views.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build`
- `npm run typecheck` — `tsc -b --noEmit`

No test suite.

## Architecture

### State stores (`src/store/`)

- `useProfile.ts` — user profile (name, sex, weight, etc.). Gates onboarding.
- `useSession.ts` — the core store. Holds:
  - `active: Session | null` — the in-progress session
  - `history: Session[]` — ended sessions (capped at 20)
  - `now: number` — ticked every 15s while a session is active
  - Actions: `startSession`, `endSession` (returns ended id), `addDrink`,
    `removeDrink`, `addFood`, `addWater`, `setExpectedHours`, `setWakeAt`,
    `setPlanToDrive`, `submitRecap`, `pendingRecapId`, `tickNow`
- `pendingRecapId()` returns the first history session that's ended, has no
  recap yet, and whose wake time (or `endedAt + 8h` default) has passed.

Persisted keys: `active`, `history` only.

### Top-level flow (`src/App.tsx`)

- If no profile → `<Onboarding />`
- Otherwise: the selected view + `<BottomNav>` + a global `<MorningRecap>` modal
- Recap lifecycle: `skippedRef` (useRef, NOT state) tracks dismissed ids so
  dismiss doesn't retrigger the effect. `dismissRecap()` always routes back to
  the session view.

### Session view (`src/pages/Session.tsx`)

Single component with two modes:
- `active === null` → returns `<StartSession />` (homepage where user configures
  duration / wake time / planToDrive and starts a session)
- `active !== null` → renders the live session UI (BAC hero, NightCurve, stat
  tiles, trackers, log, end-session button with `<ConfirmEndSheet />`)

Ticking: a 15s interval calls `tickNow()` to refresh `now` so derived math
updates. Also ticks on window focus / visibilitychange.

### Quiz (`src/components/MorningRecap.tsx`)

Full-screen modal shown when `recapId` is set in App.tsx. Local form state
(rating 1–5, symptoms, note). Submit calls `submitRecap()` then `onDismiss()`;
Skip calls `onDismiss()` directly. App.tsx's `dismissRecap` handles cleanup
and navigation to session view.

## BAC math (`src/lib/bac.ts`)

- Widmark-style discrete-time simulation. `R` = 0.68 male / 0.55 female.
- `BETA_LOW = 0.12`, `BETA_TYPICAL = 0.15`, `BETA_HIGH = 0.20` (g/L/hr).
- Absorption is linear over a per-drink window; window length depends on
  stomach state (empty 20m / snack 45m / full 75m) at the time of the drink.
- Elimination is zero-order, clamped at 0.
- Key exports:
  - `computeBacAt(inputs, beta)` — point-in-time BAC (decimal percent)
  - `computeBacRange(inputs)` — low/typical/high triple
  - `bacCurve(…)` — sampled curve for the chart
  - `peakBacInWindow(…)` — max BAC between two timestamps
  - `projectedSoberAt(inputs, threshold=0)` — steps forward in 5-min
    increments until BAC ≤ threshold. Use `0.05` for "able to drive",
    `0` for fully sober. Stable during absorption (doesn't creep).
  - `soberAtMs(inputs)` — legacy simple linear divide. Kept for reference;
    prefer `projectedSoberAt`.
  - `riskFor(bac)` — `'green' | 'yellow' | 'red'` thresholds 0.04 / 0.06
  - `recommendCutoff`, `suggestedDrinksRemaining`, `drinksUntilHangover`,
    `hangoverRiskFor`, `hangoverLabel`, `waterBehind`, `waterDeficit`

`src/lib/drinks.ts` defines `GRAMS_PER_STANDARD_DRINK_AU` (Australian std = 10g).

## Types (`src/types.ts`)

`Profile`, `Session`, `DrinkEntry`, `FoodEntry`, `WaterEntry`,
`HangoverRecap`, `RiskLevel`, `HangoverRisk`, `Symptom`, `Sex`.

`Session.planToDrive` toggles driving-mode UI (legal drinks-left tile, red
driving warning, "Able to Drive" threshold).

## Key gotchas

- Zustand action references are stable across renders — safe to use as
  `useEffect` deps without causing loops.
- Do NOT put `Set`/`Map` state in `useEffect` deps if the effect only reads
  it on fire events (focus, interval) — use `useRef` instead to avoid
  spurious re-runs. This was the root cause of the "quiz resets answers" bug.
- `AnimatePresence mode="wait"` at the top level caused stuck `opacity: 0`
  when unrelated re-renders interrupted its cycle. We use `initial={false}`
  with simultaneous crossfade instead.
- `computeBacAt` filters drinks by `d.at <= at`, so projecting forward
  (passing a future `at`) correctly accounts for pending absorption of
  already-logged drinks but does NOT anticipate unlogged future drinks.

## Directory map

```
src/
  App.tsx                  ← view router + recap modal host
  main.tsx
  index.css
  types.ts
  pages/
    Onboarding.tsx         ← profile setup, shown when no profile
    Session.tsx            ← StartSession + active session UI
    History.tsx            ← ledger of past sessions
    Settings.tsx
  components/
    MorningRecap.tsx       ← post-session quiz (rating/symptoms/note)
    ConfirmEndSheet.tsx    ← "end session" confirmation
    NightCurve.tsx         ← SVG BAC chart
    AnimatedNumber.tsx
    HangoverCard.tsx
    SessionMeta.tsx
    TrackerSheet.tsx       ← add drink/water/food
    WaterAlert.tsx
    CutoffBanner.tsx
    DrinkPicker.tsx, DrinkList.tsx, FAB.tsx, DisclaimerModal.tsx,
    BACGauge.tsx
    ui/                    ← Button, Card, Sheet primitives
    panels/
  store/
    useProfile.ts
    useSession.ts
  lib/
    bac.ts                 ← all BAC math
    drinks.ts              ← std drink constants + drink catalog
    time.ts                ← formatDuration, formatClockWithDay, formatDate
```
