import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TrackerSheet, type TrackerTab } from '@/components/TrackerSheet';
import { ConfirmEndSheet } from '@/components/ConfirmEndSheet';
import { PlanTonight } from '@/components/PlanTonight';
import { PreSession } from '@/components/PreSession';
import { HeroStateArt } from '@/components/illustrations/EditorialArt';
import {
  drinkCapRemaining,
  hasDrinkCap,
} from '@/lib/drinkCap';
import { cn } from '@/lib/utils';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import type { DrinkType, Profile } from '@/types';
import {
  BETA_TYPICAL,
  computeBacAt,
  computeBacRange,
  hangoverRiskFor,
  finalSessionPeak,
  peakBacInWindow,
  projectedSoberAt,
  riskFor,
  safeToDriveAt,
  waterBehind,
  waterDeficit,
} from '@/lib/bac';
import { formatClockWithDay } from '@/lib/time';
import type { DrinkEntry, FoodEntry, RiskLevel, WaterEntry } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Apple,
  Car,
  ChevronRight,
  CircleAlert,
  CupSoda,
  Droplets,
  GlassWater,
  Leaf,
  Moon,
  Plus,
  Salad,
  Square,
  Target,
  TriangleAlert,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react';

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
  const setPlanToDrive = useSession((s) => s.setPlanToDrive);
  const setPlannedStartAt = useSession((s) => s.setPlannedStartAt);
  const markCapBreachAttempt = useSession((s) => s.markCapBreachAttempt);
  const togglePrepDone = useSession((s) => s.togglePrepDone);
  const cancelSession = useSession((s) => s.cancelSession);

  const [trackerTab, setTrackerTab] = useState<TrackerTab | null>(null);
  const [logChooserOpen, setLogChooserOpen] = useState(false);
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
    setLogChooserOpen(false);
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
  const safeDriveAt = safeToDriveAt(inputs, 0.05);
  const sober = projectedSoberAt(inputs, 0);
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
  const plannedCap = active.plannedDrinkCap ?? 3;
  const drinksRemaining = capRemaining ?? plannedCap - active.drinks.length;
  const companion = buildSessionCompanion({
    drinksRemaining,
    drinksLogged: active.drinks.length,
    plannedCap,
    risk,
  });
  const drivingStatus = buildDrivingStatus({
    bac: range.typical,
    safeDriveAt,
    now,
  });
  const soberLabel = sober ? formatClockWithDay(sober, now) : 'clear now';
  const drivingLimitLabel = safeDriveAt
    ? formatClockWithDay(safeDriveAt, now)
    : range.typical <= 0.05
      ? 'clear now'
      : 'unknown';
  const supportCopy = buildSupportCopy(active.water.length, active.food.length);
  const heroGlow = buildHeroGlow(active.drinks.length, active.water.length, active.food.length, companion.tone);

  return (
    <div className="relative max-w-md mx-auto min-h-[calc(100vh-76px)] overflow-hidden pb-32">
      <div className="absolute inset-x-0 top-0 h-[760px]" aria-hidden>
        <HeroStateArt
          state={companion.tone === 'over' || companion.tone === 'near' ? 'high' : 'mid'}
          title="Night path through mountains"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(99,102,241,0.18),rgba(15,23,42,0)_36%),linear-gradient(180deg,rgba(15,23,42,0.15)_0%,rgba(15,23,42,0.38)_45%,#0F172A_95%)]" />
        <motion.div
          key={heroGlow.key}
          initial={{ opacity: 0.16, scale: 0.96 }}
          animate={{ opacity: heroGlow.opacity, scale: heroGlow.scale }}
          transition={{ duration: 0.45 }}
          className="absolute left-[19%] right-[19%] top-[47%] h-[150px] rounded-full blur-3xl"
          style={{ background: heroGlow.color }}
        />
      </div>

      <main className="relative z-10 px-5 pt-8">
        <header>
          <div className="flex items-start justify-between gap-3">
            <div className="font-mono text-[11px] uppercase text-ink-muted">
              Tonight · {dateLabel}
            </div>
            <DrivingSegment
              planToDrive={planToDrive}
              onSetPlanToDrive={setPlanToDrive}
            />
          </div>
          <h1 className="font-display text-[34px] leading-tight text-ink mt-2 break-words">
            Hi, <span className="italic text-accent">{firstName}.</span>
          </h1>
        </header>

        <SessionCompanionHero companion={companion} />

        <SessionActionDock
          onQuickWater={addWater}
          onOpenLog={() => setLogChooserOpen(true)}
          onEnd={() => setConfirmEnd(true)}
          waterPulse={behind}
        />

        <BacCompanionCard
          range={range}
          drivingStatus={drivingStatus}
          soberLabel={soberLabel}
          drivingLimitLabel={drivingLimitLabel}
          planToDrive={planToDrive}
          supportCopy={supportCopy}
          peak={sessionPeak}
          tone={companion.tone}
        />

        <div className="mt-4 grid grid-cols-3 gap-2">
          <SessionMiniStat label="Logged" value={active.drinks.length.toString()} />
          <SessionMiniStat label="Plan" value={plannedCap.toString()} />
          <SessionMiniStat label="Water" value={active.water.length.toString()} />
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

        <p className="font-mono text-[10px] text-ink-dim text-center mt-5">
          Estimates only. Not a breathalyzer. Do not rely on this to drive.
        </p>
      </main>

      <LogChooserSheet
        open={logChooserOpen}
        onClose={() => setLogChooserOpen(false)}
        onDrink={() => {
          setLogChooserOpen(false);
          openTracker('drink');
        }}
        onWater={() => {
          addWater();
          setLogChooserOpen(false);
        }}
        onSnack={() => {
          addFood('snack');
          setLogChooserOpen(false);
        }}
        onMeal={() => {
          addFood('meal');
          setLogChooserOpen(false);
        }}
      />

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

type CompanionTone = 'on-track' | 'mid' | 'near' | 'over';

type SessionCompanion = {
  tone: CompanionTone;
  drinksRemaining: number;
  displayValue: number;
  unit: string;
  message: string;
  accent: string;
  overPlan: boolean;
};

type DrivingStatus = {
  tone: 'safe' | 'soon' | 'unsafe';
  label: string;
  detail: string;
  accent: string;
  icon: LucideIcon;
};

function buildSessionCompanion({
  drinksRemaining,
  drinksLogged,
  plannedCap,
  risk,
}: {
  drinksRemaining: number;
  drinksLogged: number;
  plannedCap: number;
  risk: RiskLevel;
}): SessionCompanion {
  const roundedRemaining = Math.round(drinksRemaining);
  const overPlan = roundedRemaining < 0;

  if (overPlan || risk === 'red') {
    return {
      tone: 'over',
      drinksRemaining,
      displayValue: Math.max(0, roundedRemaining),
      unit: '',
      message: 'Slow it down — give yourself time',
      accent: '#EF4444',
      overPlan: true,
    };
  }

  if (roundedRemaining <= 1 || risk === 'yellow') {
    return {
      tone: 'near',
      drinksRemaining,
      displayValue: Math.max(0, roundedRemaining),
      unit: roundedRemaining === 1 ? 'drink left' : 'drinks left',
      message: roundedRemaining === 1 ? 'Last one — stay steady' : 'Pause here — stay steady',
      accent: '#F59E0B',
      overPlan: false,
    };
  }

  if (drinksLogged > 0 && roundedRemaining < plannedCap) {
    return {
      tone: 'mid',
      drinksRemaining,
      displayValue: roundedRemaining,
      unit: 'drinks left',
      message: 'Good pace — keep it steady',
      accent: '#22C55E',
      overPlan: false,
    };
  }

  return {
    tone: 'on-track',
    drinksRemaining,
    displayValue: Math.max(0, roundedRemaining),
    unit: 'drinks left',
    message: 'You’re starting steady',
    accent: '#22C55E',
    overPlan: false,
  };
}

function buildDrivingStatus({
  bac,
  safeDriveAt,
  now,
}: {
  bac: number;
  safeDriveAt: number | null;
  now: number;
}): DrivingStatus {
  if (bac > 0.05) {
    return {
      tone: 'unsafe',
      label: 'Not safe to drive',
      detail: safeDriveAt
        ? `Under 0.05 after ${formatClockWithDay(safeDriveAt, now)}`
        : 'BAC over 0.05%',
      accent: '#EF4444',
      icon: TriangleAlert,
    };
  }

  if (bac >= 0.04 || safeDriveAt !== null) {
    return {
      tone: 'soon',
      label: 'Over 0.05 soon',
      detail: 'Approaching limit',
      accent: '#F59E0B',
      icon: CircleAlert,
    };
  }

  return {
    tone: 'safe',
    label: 'Safe to drive',
    detail: 'BAC under 0.05%',
    accent: '#22C55E',
    icon: Car,
  };
}

function buildSupportCopy(waterCount: number, foodCount: number): string {
  if (waterCount > 0 && foodCount > 0) return 'food slows BAC; water logged';
  if (foodCount > 0) return 'food slows BAC curve';
  if (waterCount > 0) return 'water logged; BAC unchanged';
  return 'food affects BAC; water helps pacing';
}

function buildHeroGlow(
  drinks: number,
  water: number,
  food: number,
  tone: CompanionTone,
) {
  const support = Math.min(0.14, water * 0.015 + food * 0.05);
  const intensity = Math.max(0.18, Math.min(0.56, 0.24 + drinks * 0.07 - support));
  const toneColor =
    tone === 'over'
      ? 'rgba(239,68,68,0.72)'
      : tone === 'near'
        ? 'rgba(245,158,11,0.62)'
        : 'rgba(99,102,241,0.72)';

  return {
    key: `${drinks}-${water}-${food}-${tone}`,
    color: toneColor,
    opacity: intensity,
    scale: 1 + Math.min(0.22, drinks * 0.035),
  };
}

function DrivingSegment({
  planToDrive,
  onSetPlanToDrive,
}: {
  planToDrive: boolean;
  onSetPlanToDrive: (next: boolean) => void;
}) {
  return (
    <div className="flex rounded-full border border-line bg-bg/45 p-1 backdrop-blur-md">
      <button
        type="button"
        onClick={() => onSetPlanToDrive(true)}
        className={cn(
          'min-h-[36px] rounded-full px-3 text-[12px] font-semibold transition inline-flex items-center gap-1.5',
          planToDrive
            ? 'bg-risk-red/15 text-risk-red ring-1 ring-risk-red/45'
            : 'text-ink-muted hover:text-ink',
        )}
      >
        <Car className="h-4 w-4" strokeWidth={1.9} />
        Driving
      </button>
      <button
        type="button"
        onClick={() => onSetPlanToDrive(false)}
        className={cn(
          'min-h-[36px] rounded-full px-3 text-[12px] font-semibold transition inline-flex items-center gap-1.5',
          !planToDrive
            ? 'bg-bg-card text-ink ring-1 ring-line-2'
            : 'text-ink-muted hover:text-ink',
        )}
      >
        <Moon className="h-4 w-4" strokeWidth={1.9} />
        No driving
      </button>
    </div>
  );
}

function SessionCompanionHero({ companion }: { companion: SessionCompanion }) {
  return (
    <section className="min-h-[214px] flex flex-col items-center justify-center text-center">
      <AnimatePresence mode="wait">
        {companion.overPlan ? (
          <motion.div
            key="over"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col items-center"
          >
            <div className="grid h-20 w-20 place-items-center rounded-full border border-risk-red bg-risk-red/10 text-risk-red shadow-[0_0_36px_rgba(239,68,68,0.42)]">
              <CircleAlert className="h-10 w-10" strokeWidth={1.8} />
            </div>
            <h2 className="font-display text-[32px] leading-tight text-ink mt-4">
              You’re past<br />your plan
            </h2>
          </motion.div>
        ) : (
          <motion.div
            key={companion.displayValue}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.22 }}
          >
            <div className="font-display tabular-nums text-[104px] leading-none text-ink">
              <AnimatedNumber value={companion.displayValue} decimals={0} />
            </div>
            <div className="font-display text-[28px] leading-none text-ink -mt-1">
              {companion.unit}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key={companion.message}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-3 inline-flex items-center justify-center gap-2 text-[16px] font-semibold"
        style={{ color: companion.accent }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: companion.accent,
            boxShadow: `0 0 16px ${companion.accent}`,
          }}
        />
        {companion.message}
      </motion.div>
    </section>
  );
}

function SessionActionDock({
  onQuickWater,
  onOpenLog,
  onEnd,
  waterPulse,
}: {
  onQuickWater: () => void;
  onOpenLog: () => void;
  onEnd: () => void;
  waterPulse: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr,96px,1fr] items-end gap-3">
      <ActionButton
        label="Quick water"
        icon={Droplets}
        onClick={onQuickWater}
        pulse={waterPulse}
      />
      <button
        type="button"
        onClick={onOpenLog}
        aria-label="Log something"
        className="mx-auto grid h-[78px] w-[78px] place-items-center rounded-full border border-accent/55 bg-[linear-gradient(135deg,#6366F1_0%,#7C3AED_100%)] text-white shadow-[0_0_40px_rgba(99,102,241,0.65)] transition active:scale-[1.04]"
      >
        <Plus className="h-10 w-10" strokeWidth={1.8} />
      </button>
      <ActionButton label="End session" icon={Square} onClick={onEnd} />
    </div>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  pulse = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[74px] flex-col items-center justify-end gap-1.5 text-center text-[13px] text-ink"
    >
      <span
        className={cn(
          'grid h-[54px] w-[54px] place-items-center rounded-full border border-line bg-bg/55 text-ink backdrop-blur-md transition',
          pulse && 'border-sky/35 text-sky shadow-[0_0_22px_rgba(56,189,248,0.28)] animate-breathe',
        )}
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <span>{label}</span>
    </button>
  );
}

function BacCompanionCard({
  range,
  drivingStatus,
  soberLabel,
  drivingLimitLabel,
  planToDrive,
  supportCopy,
  peak,
  tone,
}: {
  range: ReturnType<typeof computeBacRange>;
  drivingStatus: DrivingStatus;
  soberLabel: string;
  drivingLimitLabel: string;
  planToDrive: boolean;
  supportCopy: string;
  peak: number;
  tone: CompanionTone;
}) {
  const StatusIcon = drivingStatus.icon;
  const progress = Math.max(8, Math.min(100, (range.typical / 0.08) * 100));
  const progressColor =
    tone === 'over' ? '#EF4444' : tone === 'near' ? '#F59E0B' : '#8B5CF6';
  const timingLabel = planToDrive ? 'Below 0.05 by' : 'Sober by';
  const timingValue = planToDrive ? drivingLimitLabel : soberLabel;
  const supportTone = supportCopy.includes('food') ? '#22C55E' : '#9FB0C3';

  return (
    <section className="mt-3 rounded-[22px] border border-line-2 bg-bg-card/82 p-4 shadow-card-lg backdrop-blur-md">
      <div className="grid grid-cols-[1.15fr,0.85fr] gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase text-ink-muted">BAC now</div>
          <div className="mt-1 flex items-end gap-1.5">
            <AnimatedNumber
              value={range.typical}
              decimals={3}
              className="font-display tabular-nums text-[36px] leading-none text-ink"
            />
            <span className="pb-1 text-[13px] text-ink-muted">% BAC</span>
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold"
            style={{ color: supportTone }}
          >
            <Leaf className="h-3.5 w-3.5" strokeWidth={1.8} />
            {supportCopy}
          </div>
        </div>

        <div className="border-l border-line pl-4">
          <div
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
            style={{ color: drivingStatus.accent }}
          >
            <StatusIcon className="h-4 w-4" strokeWidth={1.9} />
            {drivingStatus.label}
          </div>
          <div className="mt-1 text-[11px] leading-snug text-ink-muted">
            {drivingStatus.detail}
          </div>
          <div className="mt-4 text-[12px] text-ink-muted">{timingLabel}</div>
          <div className="mt-1 text-[19px] font-semibold text-ink">{timingValue}</div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          key={progressColor}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg,${progressColor},#A78BFA)`,
            boxShadow: `0 0 18px ${progressColor}`,
          }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-ink-dim">
        <span>range {range.low.toFixed(3)}–{range.high.toFixed(3)}</span>
        <span>peak {peak.toFixed(3)}</span>
      </div>
    </section>
  );
}

function SessionMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-line bg-bg-card/72 px-3 py-2.5 text-center backdrop-blur-md">
      <div className="font-mono text-[9px] uppercase text-ink-dim">{label}</div>
      <div className="font-display text-[23px] leading-none text-ink mt-1">{value}</div>
    </div>
  );
}

function LogChooserSheet({
  open,
  onClose,
  onDrink,
  onWater,
  onSnack,
  onMeal,
}: {
  open: boolean;
  onClose: () => void;
  onDrink: () => void;
  onWater: () => void;
  onSnack: () => void;
  onMeal: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="font-mono text-[11px] uppercase text-accent">Log something</div>
      <h2 className="font-display text-[29px] leading-tight text-ink mt-2">
        Add what changed.
      </h2>
      <p className="text-[14px] text-ink-muted mt-1">
        Water, snacks, and meals update the session instantly.
      </p>

      <div className="mt-5 space-y-2.5">
        <LogChoiceRow
          icon={Wine}
          label="Drink"
          detail="Wine, beer, cocktail or spirit"
          accent="#F59E0B"
          onClick={onDrink}
        />
        <LogChoiceRow
          icon={GlassWater}
          label="Water"
          detail="8 oz / 250 ml"
          accent="#38BDF8"
          onClick={onWater}
        />
        <LogChoiceRow
          icon={Apple}
          label="Snack"
          detail="Light snack"
          accent="#22C55E"
          onClick={onSnack}
        />
        <LogChoiceRow
          icon={Utensils}
          label="Meal"
          detail="Full meal"
          accent="#22C55E"
          onClick={onMeal}
        />
      </div>

      <div className="mt-5 rounded-[20px] border border-line bg-bg-elev/60 p-4">
        <div className="font-mono text-[10px] uppercase text-accent">How it affects your BAC</div>
        <div className="mt-3 grid gap-2.5">
          <ImpactRow icon={Activity} label="Drinks increase your BAC" detail="Based on amount, type, and time." accent="#8B5CF6" />
          <ImpactRow icon={CupSoda} label="Water helps pacing" detail="Logged for hydration; it does not lower BAC." accent="#38BDF8" />
          <ImpactRow icon={Salad} label="Food affects BAC" detail="Slows alcohol absorption in the estimate." accent="#22C55E" />
        </div>
      </div>
    </Sheet>
  );
}

function LogChoiceRow({
  icon: Icon,
  label,
  detail,
  accent,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[18px] border border-line bg-bg-elev/70 p-3 text-left transition hover:bg-bg-elev"
    >
      <div className="flex items-center gap-3">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-bg/50"
          style={{ color: accent }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-ink">{label}</span>
          <span className="block text-[13px] text-ink-muted mt-0.5">{detail}</span>
        </span>
        <ChevronRight className="h-5 w-5 text-ink-dim" strokeWidth={1.8} />
      </div>
    </button>
  );
}

function ImpactRow({
  icon: Icon,
  label,
  detail,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-bg/45"
        style={{ color: accent }}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        <span className="block text-[12px] text-ink-muted">{detail}</span>
      </span>
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

function CapMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-line/70 bg-bg-elev/65 px-3 py-2.5">
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
          className="fixed inset-0 z-[70] bg-[linear-gradient(180deg,#111C31_0%,#0F172A_100%)]"
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

              <div className="mt-6 rounded-[24px] border border-line bg-bg-elev/80 p-4 shadow-card">
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
