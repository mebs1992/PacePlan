# AGENTS.md

## Project Snapshot

- Project: `hangover-buddy`
- Product: mobile-first drinking pace planner with BAC estimates, session tracking, readiness check-ins, and morning recap insights
- Primary app: Vite + React + TypeScript + Tailwind PWA
- Secondary target: iOS wrapper in `PacePlan/` that embeds the web build
- Backend: none
- Persistence: browser `localStorage` via Zustand `persist`
- Routing: no React Router; `src/App.tsx` switches views with local component state

## Product Constraints

- This is a harm-reduction app, not a green light to drink or drive.
- Keep the disclaimer posture intact: estimates only, never present BAC as exact truth.
- The math is Australia-oriented:
  - standard drink = 10g ethanol
  - driving guidance uses a 0.05 BAC threshold
  - help links and language are AU-flavored
- Preserve the app's tone: direct, calm, editorial, mobile-first.

## Stack And Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck: `npm run typecheck`
- Web build: `npm run build`
- iOS web bundle build: `npm run build:ios`

Notes:

- `npm run build` runs `tsc -b && vite build`
- `npm run build:ios` writes into `PacePlan/PacePlan/WebApp` and then rewrites asset paths with `scripts/prepare-ios-webapp.mjs`
- There is no backend test suite in this repo right now; `typecheck` and `build` are the main validation steps

## High-Signal File Map

- `src/main.tsx`: app bootstrap, font imports, global CSS
- `src/App.tsx`: top-level view switching and bottom nav
- `src/pages/Onboarding.tsx`: seven-step setup flow, disclaimer acceptance, baseline capture
- `src/pages/Home.tsx`: readiness/home dashboard driven by sleep + hydration + baseline/session history
- `src/pages/Session.tsx`: core session experience, live BAC, pacing prompts, drink cap flow, pre-session mode
- `src/pages/History.tsx`: ended sessions and recap entry points
- `src/pages/Insights.tsx`: trends derived from recap/history data
- `src/pages/Settings.tsx`: profile summary, math explainer, privacy/data clearing
- `src/store/useProfile.ts`: persisted profile store
- `src/store/useSession.ts`: persisted active session + history store
- `src/store/useDaily.ts`: persisted daily hydration/sleep check-ins
- `src/lib/bac.ts`: BAC simulation, risk thresholds, cutoff/drive timing, hangover heuristics
- `src/lib/plan.ts`: pre-night planning logic and drink cap generation
- `src/lib/home.ts`: readiness and tonight forecast logic for home page
- `src/lib/insights.ts`: aggregation logic for history/recap analytics
- `src/lib/baseline.ts`: onboarding baseline model and labels
- `src/lib/drinks.ts`: drink presets and AU standard drink constants
- `src/lib/drinkCap.ts`: cap helpers shared by session/history
- `src/lib/prepTips.ts`: pre-session prep checklist behavior
- `src/types.ts`: domain model types
- `vite.config.ts`: PWA config, aliasing, iOS build output rules
- `tailwind.config.ts` and `src/index.css`: design tokens, typography, utility classes

## Architecture Notes

- The app is intentionally client-only. Do not assume APIs, auth, or server sync exist.
- Zustand stores are the source of truth for user data:
  - `hangover-buddy:profile`
  - `hangover-buddy:session`
  - `hangover-buddy:daily`
- `useSession` stores both `active` and `history`; history is capped at 20 sessions.
- Session timing is driven from `now` inside the session store and refreshed on intervals/focus events.
- Most business logic belongs in `src/lib/*`; UI components generally consume derived values rather than re-implementing calculations.
- UI is optimized for small screens and safe-area insets. Be careful with anything that increases vertical clutter or breaks bottom-nav/FAB spacing.

## Generated And Source-Owned Areas

Edit these:

- `src/**`
- `public/**`
- `scripts/**`
- `vite.config.ts`
- `tailwind.config.ts`
- `README.md`

Treat these as generated or build output unless the task is explicitly about them:

- `dist/**`
- `PacePlan/PacePlan/WebApp/**` after `npm run build:ios`
- `node_modules/**`

Important:

- `PacePlan/PacePlan/WebApp` is a build artifact of the web app for the native wrapper. Prefer changing `src/**` and rebuilding rather than hand-editing generated files.
- The Xcode project may contain user-specific workspace state changes; avoid touching those unless the task is truly native-iOS-specific.

## Styling Guidance

- The visual language is warm editorial paper, not generic SaaS UI.
- Reuse the existing palette and typography:
  - display: `Fraunces`
  - mono/detail text: `JetBrains Mono`
  - colors live in `tailwind.config.ts`
- Prefer existing utilities/components before inventing new patterns:
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Card.tsx`
  - `src/components/ui/Input.tsx`
  - `src/components/ui/Sheet.tsx`
- Preserve mobile affordances like `min-tap`, safe-area spacing, and readable numeric layouts.

## Change Strategy

- For behavior changes, inspect the relevant `src/lib/*` module first, then the page/component using it.
- For data model changes, update `src/types.ts` and all affected stores/selectors together.
- For anything involving session state, check both the live session flow and history/insights consequences.
- For anything involving iOS packaging, verify whether the change belongs in source files or just requires a fresh `npm run build:ios`.
- For web app changes that should ship in the iOS wrapper, run `npm run build:ios` before handoff so `PacePlan/PacePlan/WebApp` stays in sync with the latest source changes.

## Fast Start For Future Chats

If the request is broad, start by reading only:

1. `README.md`
2. `AGENTS.md`
3. `package.json`
4. the specific page/store/lib files related to the task

In most cases you do not need to scan the whole repo.
