import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { WaterAlert } from '@/components/WaterAlert';
import { CutoffBanner } from '@/components/CutoffBanner';
import { HangoverCard } from '@/components/HangoverCard';
import { SessionMeta } from '@/components/SessionMeta';
import { NightCurve } from '@/components/NightCurve';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TrackerSheet, type TrackerTab } from '@/components/TrackerSheet';
import { FAB } from '@/components/FAB';
import { ConfirmEndSheet } from '@/components/ConfirmEndSheet';
import { PlanTonight } from '@/components/PlanTonight';
import { PreSession } from '@/components/PreSession';
import {
  drinkCapRemaining,
  hasDrinkCap,
} from '@/lib/drinkCap';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import type { DrinkType, Profile } from '@/types';
import {
  BETA_TYPICAL,
  bacCurve,
  computeBacAt,
  computeBacRange,
  drinksUntilHangover,
  hangoverLabel,
  hangoverRiskFor,
  finalSessionPeak,
  peakBacInWindow,
  projectedSoberAt,
  recommendCutoff,
  riskFor,
  safeToDriveAt,
  suggestedDrinksRemaining,
  waterBehind,
  waterDeficit,
} from '@/lib/bac';
import { formatClockWithDay } from '@/lib/time';
import type { DrinkEntry, FoodEntry, RiskLevel, WaterEntry } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Droplets, Moon, Target } from 'lucide-react';

const RISK_COLOR: Record<RiskLevel, string> = {
  green: '#3A5E4C',
  yellow: '#B28034',
  red: '#8C3A2A',
};

function advisoryFor(
  risk: RiskLevel,
  bac: number,
  hangoverSevere: boolean,
  planToDrive: boolean,
  safeToDriveFutureMs: number | null,
): { text: string; color: string } {
  if (planToDrive && risk === 'red')
    return { text: 'Do not drive.', color: RISK_COLOR.red };
  if (planToDrive && risk === 'yellow')
    return { text: 'Plan a ride.', color: RISK_COLOR.yellow };
  // Current BAC may be low while a recent drink is still absorbing. If the
  // projected peak will cross the 0.05 limit, don't announce "safe to drive".
  if (planToDrive && safeToDriveFutureMs !== null)
    return { text: 'Still absorbing. Hold off.', color: RISK_COLOR.yellow };
  if (bac <= 0.001) return { text: 'Safe to drive.', color: RISK_COLOR.green };
  if (hangoverSevere)
    return { text: 'Rough morning incoming.', color: RISK_COLOR.red };
  if (risk === 'red') return { text: 'Do not drive.', color: RISK_COLOR.red };
  if (risk === 'yellow') return { text: 'Ease up.', color: RISK_COLOR.yellow };
  return { text: 'Pacing well.', color: RISK_COLOR.green };
}

type PendingDrink = {
  type: DrinkType;
  label: string;
  standardDrinks: number;
};

type CapPromptMode = 'pause' | 'confirm';

export function SessionPage() {
  const profile = useProfile((s) => s.profile)!;
  const active = useSession((s) => s.active);
  const now = useSession((s) => s.now);
  const tickNow = useSession((s) => s.tickNow);
  const startSession = useSession((s) => s.startSession);
  const endSession = useSession((s) => s.endSession);
  const addDrink = useSession((s) => s.addDrink);
  const removeDrink = useSession((s) => s.removeDrink);
  const addFood = useSession((s) => s.addFood);
  const removeFood = useSession((s) => s.removeFood);
  const addWater = useSession((s) => s.addWater);
  const removeWater = useSession((s) => s.removeWater);
  const setExpectedHours = useSession((s) => s.setExpectedHours);
  const setWakeAt = useSession((s) => s.setWakeAt);
  const setPlanToDrive = useSession((s) => s.setPlanToDrive);
  const setPlannedStartAt = useSession((s) => s.setPlannedStartAt);
  const markCapBreachAttempt = useSession((s) => s.markCapBreachAttempt);
  const togglePrepDone = useSession((s) => s.togglePrepDone);
  const cancelSession = useSession((s) => s.cancelSession);

  const [trackerTab, setTrackerTab] = useState<TrackerTab | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [pendingDrink, setPendingDrink] = useState<PendingDrink | null>(null);
  const [capPrompt, setCapPrompt] = useState<CapPromptMode | null>(null);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(tickNow, 15_000);
    const onFocus = () => tickNow();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    tickNow();
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [active, tickNow]);

  useEffect(() => {
    if (active) return;
    setTrackerTab(null);
    setConfirmEnd(false);
    setPendingDrink(null);
    setCapPrompt(null);
  }, [active]);

  const effectiveStart = active
    ? (active.plannedStartMs ?? active.startedAt)
    : 0;
  const sessionEndsAt = active
    ? effectiveStart + active.expectedHours * 60 * 60 * 1000
    : 0;
  const wakeAtMs = active?.wakeAtMs;

  const curve = useMemo(
    () =>
      active
        ? bacCurve(
            profile,
            active.drinks,
            active.food,
            effectiveStart,
            Math.max(sessionEndsAt, (wakeAtMs ?? 0) + 60_000, now + 60_000),
            100,
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, active?.drinks, active?.food, effectiveStart, sessionEndsAt, wakeAtMs],
  );

  if (!active) {
    return <StartSession profile={profile} onStart={startSession} />;
  }

  const closeTracker = () => setTrackerTab(null);
  const closeCapPrompt = () => {
    setPendingDrink(null);
    setCapPrompt(null);
  };
  const handleConfirmCapOverride = () => {
    if (!pendingDrink) return;
    addDrink(pendingDrink);
    closeCapPrompt();
  };
  const handleSwapToWater = () => {
    addWater();
    closeCapPrompt();
  };
  const handleAddDrink = (input: PendingDrink) => {
    if (
      hasDrinkCap(active) &&
      active.drinks.length + 1 > active.plannedDrinkCap
    ) {
      closeTracker();
      setPendingDrink(input);
      setCapPrompt((active.capBreachAttempts ?? 0) === 0 ? 'pause' : 'confirm');
      markCapBreachAttempt();
      return;
    }
    addDrink(input);
  };

  if (active.plannedStartMs && now < active.plannedStartMs) {
    const firstName = profile.name.split(' ')[0] || profile.name;
    return (
      <>
        <PreSession
          active={active}
          now={now}
          firstName={firstName}
          onTogglePrepDone={togglePrepDone}
          onSetPlannedStart={setPlannedStartAt}
          onStartNow={() => setPlannedStartAt(Date.now())}
          onCancel={cancelSession}
          onLogFood={() => setTrackerTab('food')}
          onLogWater={addWater}
        />
        <TrackerSheet
          open={trackerTab !== null}
          initialTab={trackerTab ?? 'food'}
          onClose={() => setTrackerTab(null)}
          drinks={active.drinks}
          water={active.water}
          food={active.food}
          behind={false}
          now={now}
          onAddDrink={handleAddDrink}
          onRemoveDrink={removeDrink}
          onAddWater={addWater}
          onRemoveWater={removeWater}
          onAddFood={addFood}
          onRemoveFood={removeFood}
        />
        <CapPausePrompt
          open={capPrompt === 'pause'}
          pendingDrink={pendingDrink}
          plannedDrinkCap={active.plannedDrinkCap}
          drinksLogged={active.drinks.length}
          onWait={closeCapPrompt}
          onAddWater={handleSwapToWater}
          onAddAnyway={handleConfirmCapOverride}
        />
        <CapConfirmSheet
          open={capPrompt === 'confirm'}
          pendingDrink={pendingDrink}
          plannedDrinkCap={active.plannedDrinkCap}
          drinksLogged={active.drinks.length}
          onClose={closeCapPrompt}
          onAddWater={handleSwapToWater}
          onConfirm={handleConfirmCapOverride}
        />
      </>
    );
  }

  const inputs = {
    profile,
    drinks: active.drinks,
    food: active.food,
    at: now,
  };
  const planToDrive = active.planToDrive ?? false;
  const range = computeBacRange(inputs);
  const risk = riskFor(range.typical);
  const sober = planToDrive
    ? safeToDriveAt(inputs, 0.05)
    : projectedSoberAt(inputs, 0);
  const cutoff = recommendCutoff(inputs, sessionEndsAt);
  const behind = waterBehind(active.drinks, active.water.length);
  const deficit = waterDeficit(active.drinks, active.water.length);

  const bacAtWake = wakeAtMs
    ? computeBacAt(
        { profile, drinks: active.drinks, food: active.food, at: wakeAtMs },
        BETA_TYPICAL,
      )
    : 0;
  const sessionPeak = peakBacInWindow(
    profile,
    active.drinks,
    active.food,
    effectiveStart,
    Math.max(sessionEndsAt, wakeAtMs ?? sessionEndsAt),
  );
  const hRisk = hangoverRiskFor(sessionPeak, bacAtWake, deficit);
  const hangoverDrinksLeft = wakeAtMs
    ? drinksUntilHangover(inputs, sessionEndsAt, wakeAtMs)
    : null;
  const legalDrinksLeft = suggestedDrinksRemaining(inputs, sessionEndsAt, 1.4, 0.045);

  const advisory = advisoryFor(
    risk,
    range.typical,
    hRisk === 'severe',
    planToDrive,
    planToDrive ? sober : null,
  );

  const dateLabel = new Date(active.startedAt)
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const firstName = profile.name.split(' ')[0] || profile.name;
  const openTracker = (tab: TrackerTab) => setTrackerTab(tab);
  const capRemaining = drinkCapRemaining(active);

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-32">
      {/* Masthead */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">TONIGHT · {dateLabel}</div>
          <h1 className="font-display text-[44px] leading-[1.02] tracking-[-0.03em] text-ink mt-1 truncate">
            Hi, <span className="italic text-accent">{firstName}.</span>
          </h1>
        </div>
        <TinyMenu planToDrive={planToDrive} onTogglePlan={() => setPlanToDrive(!planToDrive)} />
      </header>

      {/* BAC hero */}
      <div className="mt-8">
        <div className="flex items-baseline gap-2">
          <div
            className="font-display tabular-nums text-ink"
            style={{
              fontSize: 'clamp(96px, 30vw, 120px)',
              fontWeight: 300,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
            }}
          >
            <AnimatedNumber value={range.typical} decimals={3} />
          </div>
          <div className="eyebrow text-ink-dim mb-3 flex flex-col leading-[1.1]">
            <span>%</span>
            <span>BAC</span>
          </div>
        </div>
        <div className="font-mono text-[11px] text-ink-dim mt-[-4px]">
          range {range.low.toFixed(3)}–{range.high.toFixed(3)} · β typical
        </div>
        <motion.div
          key={advisory.text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex items-center gap-2 mt-4"
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: advisory.color,
              boxShadow: `0 0 10px ${advisory.color}`,
            }}
          />
          <span
            className="font-display italic"
            style={{ fontSize: 20, color: advisory.color }}
          >
            {advisory.text}
          </span>
        </motion.div>
      </div>

      {capRemaining !== null && (
        <div className="mt-5">
          <DrinkCapCard
            plannedDrinkCap={active.plannedDrinkCap!}
            drinksLogged={active.drinks.length}
            remaining={capRemaining}
          />
        </div>
      )}

      {/* Night curve card */}
      <div className="mt-5 rounded-[20px] bg-bg-card border border-line shadow-card px-3 pt-4 pb-2">
        <div className="flex items-center justify-between px-1 mb-1">
          <div className="eyebrow">NIGHT CURVE</div>
          <div className="font-mono text-[10px] text-ink-dim">
            peak · {sessionPeak.toFixed(3)}
          </div>
        </div>
        <NightCurve
          range={range}
          risk={risk}
          curve={curve}
          now={now}
          sessionStart={effectiveStart}
          sessionEnd={sessionEndsAt}
          wakeAt={wakeAtMs}
          peak={sessionPeak}
        />
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {planToDrive ? (
          <StatTile
            title="UNDER 0.05"
            big={legalDrinksLeft.toString()}
            sub={`drink${legalDrinksLeft === 1 ? '' : 's'} left`}
            flavor="driving cap"
          />
        ) : (
          <StatTile
            title="PROJECTED PEAK"
            big={sessionPeak.toFixed(3)}
            sub="max BAC tonight"
            flavor="with β 0.15"
          />
        )}
        <StatTile
          title={planToDrive ? 'ABLE TO DRIVE' : 'SOBER BY'}
          big={sober ? formatClockWithDay(sober, now) : (planToDrive ? 'clear' : '—')}
          sub={planToDrive ? 'est. ability to drive' : 'est. clearance'}
          flavor={planToDrive ? 'BAC < 0.05%' : '0.00% BAC'}
        />
      </div>

      {!planToDrive && (
        <div className="mt-3">
          <HangoverCard
            risk={hRisk}
            label={hangoverLabel(hRisk)}
            drinksLeft={hangoverDrinksLeft}
            wakeAtMs={wakeAtMs}
            now={now}
            bacAtWake={bacAtWake}
          />
        </div>
      )}

      {planToDrive && risk !== 'green' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 rounded-[20px] p-4 bg-bg-card border shadow-card"
          style={{ borderColor: RISK_COLOR.red }}
        >
          <div className="eyebrow" style={{ color: RISK_COLOR.red }}>
            DO NOT DRIVE
          </div>
          <div className="font-display text-[20px] leading-tight text-ink mt-1">
            {risk === 'red'
              ? 'You are over the 0.05 limit. Get a ride.'
              : 'Approaching the 0.05 limit. Plan a ride now.'}
          </div>
          <div className="font-mono text-[11px] text-ink-dim mt-2">
            This app is not a breathalyzer. The only safe BAC to drive is 0.00.
          </div>
        </motion.div>
      )}

      {behind && (
        <div className="mt-3">
          <WaterAlert deficit={deficit} onAdd={() => openTracker('water')} />
        </div>
      )}

      {cutoff.kind !== 'no-drinks' && (
        <div className="mt-3">
          <CutoffBanner result={cutoff} now={now} />
        </div>
      )}

      <div className="mt-3">
        <SessionMeta
          startedAt={effectiveStart}
          expectedHours={active.expectedHours}
          wakeAtMs={wakeAtMs}
          now={now}
          onChangeHours={setExpectedHours}
          onChangeWake={setWakeAt}
        />
      </div>

      <LogList
        profile={profile}
        drinks={active.drinks}
        water={active.water}
        food={active.food}
        onRemoveDrink={removeDrink}
        onRemoveWater={removeWater}
        onRemoveFood={removeFood}
      />

      <button
        type="button"
        onClick={() => setConfirmEnd(true)}
        className="w-full mt-6 py-3.5 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink transition"
      >
        End session
      </button>
      <p className="font-mono text-[10px] text-ink-dim text-center -mt-1">
        estimates only. not a breathalyzer.
      </p>

      <FAB onClick={() => openTracker('drink')} pulse={behind} />

      <TrackerSheet
        open={trackerTab !== null}
        initialTab={trackerTab ?? 'drink'}
        onClose={closeTracker}
        drinks={active.drinks}
        water={active.water}
        food={active.food}
        behind={behind}
        now={now}
        onAddDrink={handleAddDrink}
        onRemoveDrink={removeDrink}
        onAddWater={addWater}
        onRemoveWater={removeWater}
        onAddFood={addFood}
        onRemoveFood={removeFood}
      />

      <ConfirmEndSheet
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        duration={Math.max(0, now - active.startedAt)}
        drinks={active.drinks.length}
        peak={finalSessionPeak(
          profile,
          active.drinks,
          active.food,
          effectiveStart,
          now,
        )}
        onConfirm={() => {
          const peak = finalSessionPeak(
            profile,
            active.drinks,
            active.food,
            effectiveStart,
            Date.now(),
          );
          setConfirmEnd(false);
          endSession(peak, hRisk);
        }}
      />
      <CapPausePrompt
        open={capPrompt === 'pause'}
        pendingDrink={pendingDrink}
        plannedDrinkCap={active.plannedDrinkCap}
        drinksLogged={active.drinks.length}
        onWait={closeCapPrompt}
        onAddWater={handleSwapToWater}
        onAddAnyway={handleConfirmCapOverride}
      />
      <CapConfirmSheet
        open={capPrompt === 'confirm'}
        pendingDrink={pendingDrink}
        plannedDrinkCap={active.plannedDrinkCap}
        drinksLogged={active.drinks.length}
        onClose={closeCapPrompt}
        onAddWater={handleSwapToWater}
        onConfirm={handleConfirmCapOverride}
      />
    </div>
  );
}

function TinyMenu({
  planToDrive,
  onTogglePlan,
}: {
  planToDrive: boolean;
  onTogglePlan: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={planToDrive ? 'Driving mode on — menu' : 'Night mode on — menu'}
        aria-expanded={open}
        className={`relative h-auto min-h-[42px] px-2.5 py-1.5 rounded-[14px] border flex items-center gap-1.5 transition ${
          planToDrive
            ? 'bg-risk-red/10 border-risk-red/40 text-risk-red hover:bg-risk-red/15'
            : 'bg-bg-card border-line text-ink hover:bg-bg-elev'
        }`}
      >
        {planToDrive ? (
          <Car className="h-[18px] w-[18px]" strokeWidth={2} />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        )}
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
            planToDrive ? 'text-risk-red' : 'text-ink-dim'
          }`}
        >
          {planToDrive ? 'Drive' : 'Night'}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
              tabIndex={-1}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[200px] rounded-2xl border border-line bg-bg-card shadow-card-lg p-1.5"
            >
              <button
                type="button"
                onClick={() => {
                  onTogglePlan();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-bg-elev transition"
              >
                <span className="flex items-center gap-2 text-sm text-ink">
                  {planToDrive ? (
                    <Car className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  Plan to drive
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider ${
                    planToDrive ? 'text-risk-red' : 'text-ink-dim'
                  }`}
                >
                  {planToDrive ? 'ON' : 'OFF'}
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

type LogRow =
  | { kind: 'drink'; id: string; at: number; label: string; delta: number }
  | { kind: 'water'; id: string; at: number }
  | { kind: 'food'; id: string; at: number; size: string };

function LogList({
  profile,
  drinks,
  water,
  food,
  onRemoveDrink,
  onRemoveWater,
  onRemoveFood,
}: {
  profile: { weightKg: number; sex: 'male' | 'female' };
  drinks: DrinkEntry[];
  water: WaterEntry[];
  food: FoodEntry[];
  onRemoveDrink: (id: string) => void;
  onRemoveWater: (id: string) => void;
  onRemoveFood: (id: string) => void;
}) {
  const r = profile.sex === 'male' ? 0.68 : 0.55;
  const [openId, setOpenId] = useState<string | null>(null);

  const rows: LogRow[] = [
    ...drinks.map<LogRow>((d) => ({
      kind: 'drink',
      id: d.id,
      at: d.at,
      label: d.label,
      delta: d.standardDrinks / (profile.weightKg * r),
    })),
    ...water.map<LogRow>((w) => ({ kind: 'water', id: w.id, at: w.at })),
    ...food.map<LogRow>((f) => ({
      kind: 'food',
      id: f.id,
      at: f.at,
      size: f.size,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 3);

  if (rows.length === 0) return null;

  const fmt = (ms: number) => {
    const d = new Date(ms);
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="mt-5">
      <div className="eyebrow mb-2">LOG · LAST {rows.length}</div>
      <div className="rounded-[20px] bg-bg-card border border-line overflow-hidden">
        {rows.map((row, i) => {
          const isOpen = openId === row.id;
          return (
            <div key={row.id} className={i > 0 ? 'border-t border-line' : ''}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : row.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-elev transition"
              >
                <span className="font-mono text-[11px] text-ink-dim w-10 shrink-0">
                  {fmt(row.at)}
                </span>
                <span className="text-[14px] text-ink flex-1 truncate">
                  {row.kind === 'drink'
                    ? row.label
                    : row.kind === 'water'
                      ? 'Water'
                      : `Food · ${row.size}`}
                </span>
                <span className="font-mono text-[11px] text-ink-dim tabular-nums shrink-0">
                  {row.kind === 'drink'
                    ? `+${row.delta.toFixed(3)}`
                    : row.kind === 'water'
                      ? '−'
                      : '·'}
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-end gap-2 px-4 pb-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (row.kind === 'drink') onRemoveDrink(row.id);
                          else if (row.kind === 'water') onRemoveWater(row.id);
                          else onRemoveFood(row.id);
                          setOpenId(null);
                        }}
                        className="font-mono text-[10px] uppercase tracking-wider text-risk-red hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({
  title,
  big,
  sub,
  flavor,
}: {
  title: string;
  big: string;
  sub: string;
  flavor: string;
}) {
  return (
    <div className="rounded-[20px] p-3.5 bg-bg-card border border-line shadow-card">
      <div className="eyebrow">{title}</div>
      <div className="font-display tabular-nums text-ink text-[28px] leading-none mt-1.5">
        {big}
      </div>
      <div className="text-[12px] text-ink-muted mt-1">{sub}</div>
      <div className="font-mono text-[10px] text-ink-dim mt-0.5">{flavor}</div>
    </div>
  );
}

function DrinkCapCard({
  plannedDrinkCap,
  drinksLogged,
  remaining,
}: {
  plannedDrinkCap: number;
  drinksLogged: number;
  remaining: number;
}) {
  const overBy = Math.max(0, -remaining);
  const atCap = remaining === 0;
  const tone =
    overBy > 0
      ? {
          accent: '#8C3A2A',
          bg: 'rgba(140,58,42,0.08)',
          border: 'rgba(140,58,42,0.22)',
          copy: `Past your ${plannedDrinkCap}-drink cap. Slow down and switch to water.`,
        }
      : atCap
        ? {
            accent: '#B28034',
            bg: 'rgba(178,128,52,0.08)',
            border: 'rgba(178,128,52,0.22)',
            copy: `At your cap. The next drink will trigger a pause.`,
          }
        : {
            accent: '#3A5E4C',
            bg: 'rgba(58,94,76,0.08)',
            border: 'rgba(58,94,76,0.2)',
            copy: `${drinksLogged} logged so far. Stay on water between rounds.`,
          };
  const big = overBy > 0 ? overBy.toString() : remaining.toString();
  const label = overBy > 0 ? 'over' : 'left';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border p-4 shadow-card"
      style={{ borderColor: tone.border, background: tone.bg }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow" style={{ color: tone.accent }}>
            DRINKS REMAINING
          </div>
          <div className="flex items-end gap-2 mt-2">
            <div
              className="font-display tabular-nums leading-none"
              style={{ fontSize: 64, color: tone.accent, fontWeight: 300 }}
            >
              {big}
            </div>
            <div
              className="font-mono text-[11px] uppercase tracking-[0.18em] mb-2"
              style={{ color: tone.accent }}
            >
              {label}
            </div>
          </div>
          <p className="font-display text-[17px] leading-snug text-ink mt-1 max-w-[18rem]">
            {tone.copy}
          </p>
        </div>
        <div className="rounded-full border border-line bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted shrink-0">
          {drinksLogged}/{plannedDrinkCap} logged
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <CapMiniStat label="CAP" value={plannedDrinkCap.toString()} />
        <CapMiniStat
          label={overBy > 0 ? 'OVER BY' : 'NEXT'}
          value={overBy > 0 ? overBy.toString() : remaining === 0 ? 'Pause' : 'Water'}
        />
      </div>
    </motion.div>
  );
}

function CapMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-line/70 bg-white/65 px-3 py-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-dim">
        {label}
      </div>
      <div className="font-display text-[20px] leading-none text-ink mt-1">
        {value}
      </div>
    </div>
  );
}

function CapPausePrompt({
  open,
  pendingDrink,
  plannedDrinkCap,
  drinksLogged,
  onWait,
  onAddWater,
  onAddAnyway,
}: {
  open: boolean;
  pendingDrink: PendingDrink | null;
  plannedDrinkCap: number | undefined;
  drinksLogged: number;
  onWait: () => void;
  onAddWater: () => void;
  onAddAnyway: () => void;
}) {
  const nextCount = drinksLogged + 1;

  return (
    <AnimatePresence>
      {open && pendingDrink && plannedDrinkCap !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-[linear-gradient(180deg,#F7F1E7_0%,#F1E5D1_100%)]"
        >
          <div
            className="max-w-md mx-auto min-h-full px-5 flex flex-col justify-between"
            style={{
              paddingTop: 'max(2rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            }}
          >
            <div>
              <div className="eyebrow text-risk-red">PAUSE HERE</div>
              <div className="h-14 w-14 rounded-full border border-risk-red/25 bg-risk-red/10 flex items-center justify-center mt-5">
                <Target className="h-6 w-6 text-risk-red" />
              </div>
              <h2 className="font-display text-[38px] leading-[1.02] tracking-[-0.03em] text-ink mt-5">
                Next drink puts you over tonight&apos;s cap.
              </h2>
              <p className="font-display italic text-[19px] text-ink-muted mt-4 leading-snug">
                Wait 15 minutes, drink some water, then see how you feel.
              </p>

              <div className="mt-6 rounded-[24px] border border-line bg-white/80 p-4 shadow-card">
                <div className="eyebrow">ABOUT TO LOG</div>
                <div className="font-display text-[24px] text-ink mt-2 leading-tight">
                  {pendingDrink.label}
                </div>
                <div className="font-mono text-[11px] text-ink-dim mt-1.5 tracking-tight">
                  {pendingDrink.standardDrinks.toFixed(1)} std · makes it {nextCount}/{plannedDrinkCap}{' '}
                  drinks tonight
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <CapMiniStat label="CAP" value={plannedDrinkCap.toString()} />
                <CapMiniStat label="LOGGED" value={drinksLogged.toString()} />
              </div>
            </div>

            <div className="space-y-2.5">
              <Button
                className="w-full"
                size="lg"
                onClick={onAddWater}
              >
                <span className="inline-flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Log water instead
                </span>
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={onWait}
              >
                I&apos;ll wait 15 minutes
              </Button>
              <button
                type="button"
                onClick={onAddAnyway}
                className="w-full py-3 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink transition"
              >
                Add this drink anyway
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CapConfirmSheet({
  open,
  pendingDrink,
  plannedDrinkCap,
  drinksLogged,
  onClose,
  onAddWater,
  onConfirm,
}: {
  open: boolean;
  pendingDrink: PendingDrink | null;
  plannedDrinkCap: number | undefined;
  drinksLogged: number;
  onClose: () => void;
  onAddWater: () => void;
  onConfirm: () => void;
}) {
  if (!pendingDrink || plannedDrinkCap === undefined) return null;

  const overBy = Math.max(1, drinksLogged + 1 - plannedDrinkCap);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="eyebrow text-risk-red">OVER THE CAP</div>
      <h2 className="font-display text-[28px] leading-[1.06] tracking-[-0.02em] text-ink mt-2">
        This drink puts you {overBy} over tonight&apos;s cap.
      </h2>
      <p className="font-display italic text-[16px] text-ink-muted mt-3 leading-snug">
        {pendingDrink.label} · {pendingDrink.standardDrinks.toFixed(1)} std
      </p>

      <div className="grid grid-cols-2 gap-2 mt-5">
        <CapMiniStat label="CAP" value={plannedDrinkCap.toString()} />
        <CapMiniStat label="LOGGED" value={drinksLogged.toString()} />
      </div>

      <div className="space-y-2.5 mt-6">
        <Button className="w-full" size="lg" onClick={onConfirm}>
          Add anyway
        </Button>
        <Button className="w-full" size="lg" variant="secondary" onClick={onAddWater}>
          Log water instead
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink transition"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}

function StartSession({
  profile,
  onStart,
}: {
  profile: Profile;
  onStart: (
    h: number,
    opts?: {
      wakeAtMs?: number;
      planToDrive?: boolean;
      plannedStartMs?: number;
      plannedDrinkCap?: number;
    },
  ) => void;
}) {
  return <PlanTonight profile={profile} onStart={onStart} />;
}
