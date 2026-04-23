import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Droplets, Moon } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { LandscapeArt, TrendSparkArt } from '@/components/illustrations/EditorialArt';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import {
  buildReadinessSnapshot,
  buildTonightForecast,
  forecastDrinkingOutlook,
  sleepHoursForDay,
  waterGlassesForDay,
  type ReadinessFactor,
  type ReadinessSnapshot,
} from '@/lib/home';
import { buildDrinkTargetOptions } from '@/lib/plan';
import { helperImpacts } from '@/lib/insights';
import { useDaily } from '@/store/useDaily';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';

type Props = {
  onOpenSession: () => void;
  onOpenInsights: () => void;
};

type HomeSheet = 'none' | 'sleep' | 'water' | 'why';

export function HomePage({ onOpenSession, onOpenInsights }: Props) {
  const profile = useProfile((s) => s.profile)!;
  const active = useSession((s) => s.active);
  const history = useSession((s) => s.history);
  const now = useSession((s) => s.now);
  const tickNow = useSession((s) => s.tickNow);

  const hydrationByDay = useDaily((s) => s.hydrationByDay);
  const sleepByDay = useDaily((s) => s.sleepByDay);
  const addHydration = useDaily((s) => s.addHydration);
  const removeHydration = useDaily((s) => s.removeHydration);
  const setHydration = useDaily((s) => s.setHydration);
  const setSleep = useDaily((s) => s.setSleep);

  const [sheet, setSheet] = useState<HomeSheet>('none');
  const [sleepDraft, setSleepDraft] = useState(8);
  const [waterDraft, setWaterDraft] = useState(0);

  useEffect(() => {
    tickNow();
    const id = window.setInterval(tickNow, 60_000);
    const onFocus = () => tickNow();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [tickNow]);

  const snapshot = useMemo(
    () =>
      buildReadinessSnapshot({
        profile,
        history,
        active,
        hydrationByDay,
        sleepByDay,
        atMs: now,
      }),
    [profile, history, active, hydrationByDay, sleepByDay, now],
  );

  const tonightForecast = useMemo(
    () => buildTonightForecast(profile, history, now),
    [profile, history, now],
  );

  const todayWaterGlasses = waterGlassesForDay(hydrationByDay, now);
  const todaySleepHours = sleepHoursForDay(sleepByDay, now);
  const targetDrinks = tonightForecast.suggestedEasyMorningLine;
  const targetOptions = useMemo(
    () => buildDrinkTargetOptions(targetDrinks, tonightForecast.plan.drinksCap),
    [targetDrinks, tonightForecast.plan.drinksCap],
  );
  const pushDrinks = [...targetOptions].reverse().find((value) => value > targetDrinks) ?? targetDrinks;

  const targetOutlook = useMemo(
    () => forecastDrinkingOutlook(snapshot.score, targetDrinks, targetDrinks),
    [snapshot.score, targetDrinks],
  );
  const pushOutlook = useMemo(
    () => forecastDrinkingOutlook(snapshot.score, pushDrinks, targetDrinks),
    [snapshot.score, pushDrinks, targetDrinks],
  );

  const firstName = profile.name.split(' ')[0] || profile.name;
  const todayLabel = new Date(now)
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();

  const insight = useMemo(() => {
    const helper = helperImpacts(history)
      .filter((item) => item.delta > 0.25)
      .sort((a, b) => b.delta - a.delta)[0];
    if (helper) {
      return {
        title: `${helper.label} is doing real work.`,
        body: `Recaps run ${helper.delta.toFixed(1)} points better when you do it.`,
      };
    }
    return {
      title: 'The pattern sharpens with each recap.',
      body: 'Morning check-ins help this line get more personal, less generic.',
    };
  }, [history]);

  function openSleepSheet() {
    setSleepDraft(todaySleepHours > 0 ? todaySleepHours : 8);
    setSheet('sleep');
  }

  function openWaterSheet() {
    setWaterDraft(todayWaterGlasses);
    setSheet('water');
  }

  function closeSheets() {
    setSheet('none');
  }

  function saveSleep() {
    setSleep(Number(sleepDraft.toFixed(1)), now);
    closeSheets();
  }

  function saveWater() {
    setHydration(Math.max(0, waterDraft), now);
    closeSheets();
  }

  return (
    <>
      <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <div className="eyebrow">{todayLabel}</div>
          <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.035em] text-ink mt-3">
            Your line for tonight, <span className="italic text-accent">{firstName}.</span>
          </h1>
          <p className="font-display italic text-[17px] text-ink-muted mt-3 leading-snug">
            Simple inputs. Smarter nights.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <StatusPill accent={readinessAccent(snapshot)}>
              {snapshot.score === null ? (
                'baseline needed'
              ) : (
                <>
                  readiness <AnimatedNumber value={snapshot.score} decimals={0} />/100
                </>
              )}
            </StatusPill>
            {buildSignalPills(snapshot).map((pill) => (
              <StatusPill key={pill.label} accent={pill.accent}>
                {pill.label}
              </StatusPill>
            ))}
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
        >
          {active ? (
            <LiveTonightCard
              drinksLogged={active.drinks.length}
              plannedDrinkCap={active.plannedDrinkCap}
              waterLogged={active.water.length}
              onOpenSession={onOpenSession}
              onOpenWhy={() => setSheet('why')}
            />
          ) : (
            <TonightCallCard
              targetDrinks={targetDrinks}
              targetOutlook={targetOutlook}
              pushDrinks={pushDrinks}
              pushOutlook={pushOutlook}
              summary={buildTonightSummary(snapshot, targetDrinks)}
              onPlan={onOpenSession}
              onOpenWhy={() => setSheet('why')}
            />
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-4"
        >
          <InputsCard
            snapshot={snapshot}
            todaySleepHours={todaySleepHours}
            todayWaterGlasses={todayWaterGlasses}
            onOpenSleep={openSleepSheet}
            onOpenWater={openWaterSheet}
            onQuickWater={() => addHydration(1, now)}
            onUndoWater={() => removeHydration(1, now)}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="mt-4"
        >
          <button
            type="button"
            onClick={onOpenInsights}
            className="w-full text-left rounded-[28px] border border-line bg-bg-card px-5 py-5 shadow-card transition hover:bg-white"
          >
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="eyebrow">PATTERN SIGNAL</div>
                <h2 className="font-display text-[25px] leading-[1.08] tracking-[-0.03em] text-ink mt-2">
                  {insight.title}
                </h2>
                <p className="font-display italic text-[14px] leading-snug text-ink-muted mt-2 max-w-[16rem]">
                  {insight.body}
                </p>
              </div>
              <div className="w-[104px] h-[96px] rounded-[22px] overflow-hidden border border-line bg-[#F6EFE3] shrink-0">
                <TrendSparkArt />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
              Open pattern view
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </button>
        </motion.section>
      </div>

      <SleepSheet
        open={sheet === 'sleep'}
        value={sleepDraft}
        onClose={closeSheets}
        onDecrease={() => setSleepDraft((value) => Math.max(0, roundToHalf(value - 0.5)))}
        onIncrease={() => setSleepDraft((value) => Math.min(12, roundToHalf(value + 0.5)))}
        onSelect={(value) => setSleepDraft(value)}
        onSave={saveSleep}
      />

      <WaterSheet
        open={sheet === 'water'}
        glasses={waterDraft}
        onClose={closeSheets}
        onDecrease={() => setWaterDraft((value) => Math.max(0, value - 1))}
        onIncrease={() => setWaterDraft((value) => Math.min(20, value + 1))}
        onSelect={(value) => setWaterDraft(value)}
        onSave={saveWater}
      />

      <WhyLineSheet
        open={sheet === 'why'}
        onClose={closeSheets}
        snapshot={snapshot}
        targetDrinks={targetDrinks}
        plannerCap={tonightForecast.plan.drinksCap}
        plannedStartMs={tonightForecast.plannedStartMs}
        wakeAtMs={tonightForecast.wakeAtMs}
        expectedHours={tonightForecast.expectedHours}
      />
    </>
  );
}

function TonightCallCard({
  targetDrinks,
  targetOutlook,
  pushDrinks,
  pushOutlook,
  summary,
  onPlan,
  onOpenWhy,
}: {
  targetDrinks: number;
  targetOutlook: ReturnType<typeof forecastDrinkingOutlook>;
  pushDrinks: number;
  pushOutlook: ReturnType<typeof forecastDrinkingOutlook>;
  summary: string;
  onPlan: () => void;
  onOpenWhy: () => void;
}) {
  return (
    <Card className="rounded-[30px] overflow-hidden p-0">
      <div className="p-5">
        <div className="grid grid-cols-[1.02fr,0.98fr] gap-4 items-end">
          <div className="min-w-0">
            <div className="eyebrow">TONIGHT&apos;S CALL</div>
            <div className="font-display text-[66px] leading-[0.88] tracking-[-0.055em] text-ink mt-3">
              {targetDrinks}
            </div>
            <div className="font-display text-[29px] leading-[0.95] tracking-[-0.03em] text-ink mt-1">
              drink{targetDrinks === 1 ? '' : 's'}
            </div>
            <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-4 max-w-[13rem]">
              {summary}
            </p>
          </div>
          <div className="rounded-[24px] overflow-hidden border border-line bg-[#F3EBDD] aspect-[1.02/0.92]">
            <LandscapeArt />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <ScenarioCard
            label="Stay near"
            value={drinkCountLabel(targetDrinks)}
            detail={outlookWord(targetOutlook)}
            accent={targetOutlook.accent}
          />
          <ScenarioCard
            label="Push to"
            value={drinkCountLabel(pushDrinks)}
            detail={pushDrinks === targetDrinks ? 'Already at the ceiling' : outlookWord(pushOutlook)}
            accent={pushOutlook.accent}
          />
        </div>

        <Button className="w-full mt-5" size="lg" onClick={onPlan}>
          <span className="inline-flex items-center gap-2">
            Plan tonight
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
        <button
          type="button"
          onClick={onOpenWhy}
          className="w-full mt-3 font-display text-[15px] text-ink-muted transition hover:text-ink"
        >
          Why this line?
        </button>
      </div>
    </Card>
  );
}

function LiveTonightCard({
  drinksLogged,
  plannedDrinkCap,
  waterLogged,
  onOpenSession,
  onOpenWhy,
}: {
  drinksLogged: number;
  plannedDrinkCap?: number;
  waterLogged: number;
  onOpenSession: () => void;
  onOpenWhy: () => void;
}) {
  return (
    <Card className="rounded-[30px] overflow-hidden p-0">
      <div className="p-5">
        <div className="grid grid-cols-[1.05fr,0.95fr] gap-4 items-end">
          <div className="min-w-0">
            <div className="eyebrow">SESSION LIVE</div>
            <h2 className="font-display text-[34px] leading-[1] tracking-[-0.035em] text-ink mt-3">
              Stay close to the plan.
            </h2>
            <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-3 max-w-[13rem]">
              {plannedDrinkCap
                ? `${drinksLogged} of ${plannedDrinkCap} drinks logged so far.`
                : `${drinksLogged} drinks logged so far.`}{' '}
              Water still buys the cleanest landing.
            </p>
          </div>
          <div className="rounded-[24px] border border-line bg-[#F6EFE3] p-4">
            <div className="flex items-center justify-between border-b border-line/80 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                drinks
              </span>
              <span className="font-display text-[28px] leading-none text-ink">
                {drinksLogged}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
                water
              </span>
              <span className="font-display text-[28px] leading-none text-ink">
                {waterLogged}
              </span>
            </div>
          </div>
        </div>

        <Button className="w-full mt-5" size="lg" onClick={onOpenSession}>
          <span className="inline-flex items-center gap-2">
            Back to session
            <ArrowRight className="h-4 w-4" />
          </span>
        </Button>
        <button
          type="button"
          onClick={onOpenWhy}
          className="w-full mt-3 font-display text-[15px] text-ink-muted transition hover:text-ink"
        >
          See the planning context
        </button>
      </div>
    </Card>
  );
}

function InputsCard({
  snapshot,
  todaySleepHours,
  todayWaterGlasses,
  onOpenSleep,
  onOpenWater,
  onQuickWater,
  onUndoWater,
}: {
  snapshot: ReadinessSnapshot;
  todaySleepHours: number;
  todayWaterGlasses: number;
  onOpenSleep: () => void;
  onOpenWater: () => void;
  onQuickWater: () => void;
  onUndoWater: () => void;
}) {
  const sleepProgress = Math.max(0, Math.min(1, todaySleepHours / 8));
  const waterLitres = todayWaterGlasses * 0.25;
  const waterProgress = snapshot.waterTargetMl > 0
    ? Math.max(0, Math.min(1, snapshot.waterTodayMl / snapshot.waterTargetMl))
    : 0;

  return (
    <Card className="rounded-[30px] p-0 overflow-hidden">
      <div className="px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">TODAY&apos;S INPUTS</div>
            <h2 className="font-display text-[30px] leading-[1.02] tracking-[-0.03em] text-ink mt-2">
              Keep the inputs honest.
            </h2>
          </div>
          <StatusPill accent="#D0B38A">supporting context</StatusPill>
        </div>

        <div className="space-y-3 mt-4">
          <InputRow
            icon={<Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            label="Sleep"
            value={todaySleepHours > 0 ? `${todaySleepHours.toFixed(1)}h` : 'Not logged'}
            note={
              todaySleepHours > 0
                ? sleepProgress >= 1
                  ? 'Sleep target hit for today.'
                  : `${(8 - todaySleepHours).toFixed(1)}h short of the 8h target.`
                : 'Log last night and this line gets more personal.'
            }
            progress={sleepProgress}
            accent="#A99663"
            onOpen={onOpenSleep}
          />

          <InputRow
            icon={<Droplets className="h-[18px] w-[18px]" strokeWidth={1.8} />}
            label="Water"
            value={`${waterLitres.toFixed(1)}L`}
            note={
              waterProgress >= 1
                ? 'Hydration target hit for today.'
                : `${Math.max(0, Math.ceil((snapshot.waterTargetMl - snapshot.waterTodayMl) / 250))} glasses to go.`
            }
            progress={waterProgress}
            accent="#6F8D83"
            onOpen={onOpenWater}
            quickAction={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickWater();
                  }}
                  className="rounded-full border border-[#6F8D8333] bg-[#6F8D8310] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#567468] transition hover:bg-[#6F8D8318]"
                >
                  +250mL
                </button>
                {todayWaterGlasses > 0 && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onUndoWater();
                    }}
                    className="rounded-full border border-line bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim transition hover:bg-bg-elev"
                  >
                    Undo
                  </button>
                )}
              </div>
            }
          />
        </div>
      </div>
    </Card>
  );
}

function InputRow({
  icon,
  label,
  value,
  note,
  progress,
  accent,
  onOpen,
  quickAction,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  progress: number;
  accent: string;
  onOpen: () => void;
  quickAction?: ReactNode;
}) {
  return (
    <div className="w-full rounded-[24px] border border-line bg-[#FCF8F1] p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-1 text-ink-muted">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-[23px] leading-none text-ink">
                  {label}
                </div>
                <p className="font-display italic text-[13px] leading-snug text-ink-muted mt-2 max-w-[13rem]">
                  {note}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-[30px] leading-none tracking-[-0.035em] text-ink">
                  {value}
                </div>
                <button
                  type="button"
                  onClick={onOpen}
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent mt-2 transition hover:opacity-75"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="mt-4 h-2 rounded-full bg-[#EBE3D2] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: progress > 0 ? `${Math.max(8, Math.min(100, progress * 100))}%` : '0%',
                  background: accent,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {quickAction && <div className="mt-4">{quickAction}</div>}
    </div>
  );
}

function ScenarioCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-[22px] border px-4 py-4"
      style={{
        borderColor: `${accent}2B`,
        background: `${accent}10`,
      }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
        {label}
      </div>
      <div className="font-display text-[29px] leading-none text-ink mt-3">
        {value}
      </div>
      <div className="font-display italic text-[14px] leading-snug text-ink-muted mt-2">
        {detail}
      </div>
    </div>
  );
}

function WhyLineSheet({
  open,
  onClose,
  snapshot,
  targetDrinks,
  plannerCap,
  plannedStartMs,
  wakeAtMs,
  expectedHours,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: ReadinessSnapshot;
  targetDrinks: number;
  plannerCap: number;
  plannedStartMs: number;
  wakeAtMs: number;
  expectedHours: number;
}) {
  const weakest = weakestFactor(snapshot);
  const startLabel = new Date(plannedStartMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const wakeLabel = new Date(wakeAtMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Sheet open={open} onClose={onClose} title="Why this line?">
      <div className="space-y-4">
        <div className="rounded-[22px] border border-line bg-bg-elev p-4">
          <div className="eyebrow">THE LINE</div>
          <div className="font-display text-[36px] leading-none tracking-[-0.04em] text-ink mt-2">
            {drinkCountLabel(targetDrinks)}
          </div>
          <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-3">
            This is the cleaner target for tonight. The planner ceiling is {drinkCountLabel(plannerCap)}.
          </p>
        </div>

        <div className="rounded-[22px] border border-line bg-bg-card p-4">
          <div className="eyebrow">WHAT&apos;S MOVING IT</div>
          <div className="font-display text-[25px] leading-[1.08] tracking-[-0.03em] text-ink mt-2">
            {factorHeadline(weakest)}
          </div>
          <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-2">
            {factorBody(snapshot, weakest)}
          </p>
        </div>

        <div className="rounded-[22px] border border-line bg-bg-card p-4">
          <div className="eyebrow">FORECAST DEFAULTS</div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <MetricCell label="START" value={startLabel} />
            <MetricCell label="DURATION" value={`${expectedHours}h`} />
            <MetricCell label="WAKE" value={wakeLabel} />
          </div>
          <p className="font-mono text-[10px] leading-snug tracking-tight text-ink-dim mt-4">
            These are only the default assumptions for tonight&apos;s line. The full planner lets you tighten or relax them before you save the plan.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim">
        {label}
      </div>
      <div className="font-display text-[20px] leading-none text-ink mt-2">
        {value}
      </div>
    </div>
  );
}

function StatusPill({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <div
      className="inline-flex items-center rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]"
      style={{
        borderColor: `${accent}33`,
        color: accent,
        background: `${accent}12`,
      }}
    >
      {children}
    </div>
  );
}

function SleepSheet({
  open,
  value,
  onClose,
  onDecrease,
  onIncrease,
  onSelect,
  onSave,
}: {
  open: boolean;
  value: number;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onSelect: (value: number) => void;
  onSave: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Last night&apos;s sleep">
      <EntrySheetValue
        value={`${value.toFixed(1)}h`}
        sub="Tap the number that feels right, then save."
      />

      <StepperRow onDecrease={onDecrease} onIncrease={onIncrease} />

      <div className="grid grid-cols-5 gap-2 mt-5">
        {[5, 6, 7, 8, 9].map((preset) => (
          <QuickOption
            key={preset}
            active={Math.abs(value - preset) < 0.01}
            onClick={() => onSelect(preset)}
          >
            {preset}h
          </QuickOption>
        ))}
      </div>

      <Button className="w-full mt-6" size="lg" onClick={onSave}>
        Save sleep
      </Button>
    </Sheet>
  );
}

function WaterSheet({
  open,
  glasses,
  onClose,
  onDecrease,
  onIncrease,
  onSelect,
  onSave,
}: {
  open: boolean;
  glasses: number;
  onClose: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onSelect: (value: number) => void;
  onSave: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Water today">
      <EntrySheetValue
        value={`${(glasses * 0.25).toFixed(1)}L`}
        sub="Each step is one 250mL glass."
      />

      <StepperRow onDecrease={onDecrease} onIncrease={onIncrease} />

      <div className="grid grid-cols-4 gap-2 mt-5">
        {[1, 2, 4, 6].map((preset) => (
          <QuickOption
            key={preset}
            active={glasses === preset}
            onClick={() => onSelect(preset)}
          >
            {(preset * 0.25).toFixed(1)}L
          </QuickOption>
        ))}
      </div>

      <Button className="w-full mt-6" size="lg" onClick={onSave}>
        Save water
      </Button>
    </Sheet>
  );
}

function EntrySheetValue({
  value,
  sub,
}: {
  value: string;
  sub: string;
}) {
  return (
    <div className="text-center">
      <div className="font-display text-[52px] leading-none tracking-[-0.05em] text-ink">
        {value}
      </div>
      <div className="font-display italic text-[14px] leading-snug text-ink-muted mt-2">
        {sub}
      </div>
    </div>
  );
}

function StepperRow({
  onDecrease,
  onIncrease,
}: {
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      <button
        type="button"
        onClick={onDecrease}
        className="h-12 rounded-2xl border border-line bg-bg-card font-display text-[30px] leading-none text-ink transition hover:bg-bg-elev"
      >
        -
      </button>
      <button
        type="button"
        onClick={onIncrease}
        className="h-12 rounded-2xl border border-line bg-bg-card font-display text-[30px] leading-none text-ink transition hover:bg-bg-elev"
      >
        +
      </button>
    </div>
  );
}

function QuickOption({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-3 font-mono text-[11px] uppercase tracking-[0.14em] transition ${
        active
          ? 'border border-accent bg-accent/10 text-accent'
          : 'border border-line bg-bg-card text-ink-dim hover:bg-bg-elev'
      }`}
    >
      {children}
    </button>
  );
}

function weakestFactor(snapshot: ReadinessSnapshot): ReadinessFactor {
  return [...snapshot.factors].sort((a, b) => a.normalized - b.normalized)[0];
}

function strongestFactor(snapshot: ReadinessSnapshot): ReadinessFactor {
  return [...snapshot.factors].sort((a, b) => b.normalized - a.normalized)[0];
}

function buildSignalPills(snapshot: ReadinessSnapshot): Array<{ label: string; accent: string }> {
  if (!snapshot.factors.length) return [];

  const strongest = strongestFactor(snapshot);
  const weakest = weakestFactor(snapshot);
  const pills: Array<{ label: string; accent: string }> = [];

  if (strongest.normalized >= 0.72) {
    pills.push({
      label: `${factorNoun(strongest.key)} helping`,
      accent: strongest.accent,
    });
  }

  if (weakest.key !== strongest.key || pills.length === 0) {
    pills.push({
      label: `${factorNoun(weakest.key)} lagging`,
      accent: weakest.accent,
    });
  }

  return pills.slice(0, 2);
}

function buildTonightSummary(snapshot: ReadinessSnapshot, targetDrinks: number): string {
  if (snapshot.score === null) {
    return 'Log sleep and water first, then this turns from a guess into your line.';
  }
  if (snapshot.score >= 72) {
    return `${drinkCountLabel(targetDrinks)} keeps the night feeling easy tomorrow.`;
  }
  if (snapshot.score >= 45) {
    return `${drinkCountLabel(targetDrinks)} is the steadier call if you want tomorrow back.`;
  }
  return targetDrinks <= 1
    ? 'Tonight looks better as a skip or a single slow drink.'
    : `${drinkCountLabel(targetDrinks)} is the cleanest cap your body has tonight.`;
}

function factorHeadline(factor: ReadinessFactor): string {
  switch (factor.key) {
    case 'hydration':
      return 'Hydration is moving the line fastest.';
    case 'sleep':
      return 'Sleep is setting the tone tonight.';
    case 'recovery':
      return 'Recovery is still thin right now.';
    case 'load':
      return 'Recent drinking load is shrinking the buffer.';
  }
}

function factorBody(snapshot: ReadinessSnapshot, factor: ReadinessFactor): string {
  switch (factor.key) {
    case 'hydration':
      return `You are sitting at ${(snapshot.waterTodayMl / 1000).toFixed(1)}L today, so water is still the quickest lever before the first drink.`;
    case 'sleep':
      return `${snapshot.sleepTodayHours.toFixed(1)}h of sleep is not giving tonight much margin.`;
    case 'recovery':
      return `${snapshot.daysSinceLastDrink} dry day${snapshot.daysSinceLastDrink === 1 ? '' : 's'} means your recovery cushion is still building back up.`;
    case 'load':
      return `${snapshot.drinks7dSum.toFixed(1)} standard drinks over the last 7 days is quietly lowering tonight's ceiling.`;
  }
}

function factorNoun(key: ReadinessFactor['key']): string {
  switch (key) {
    case 'hydration':
      return 'hydration';
    case 'sleep':
      return 'sleep';
    case 'recovery':
      return 'recovery';
    case 'load':
      return 'recent load';
  }
}

function readinessAccent(snapshot: ReadinessSnapshot): string {
  if (snapshot.score === null) return '#B28034';
  if (snapshot.score >= 70) return '#3A5E4C';
  if (snapshot.score >= 45) return '#B28034';
  return '#8C3A2A';
}

function outlookWord(outlook: ReturnType<typeof forecastDrinkingOutlook>): string {
  switch (outlook.label) {
    case 'None':
      return 'Sweeter spot for tomorrow.';
    case 'Mild':
      return 'Mild morning likely.';
    case 'Rough':
      return 'Rough morning likely.';
    case 'Brutal':
      return 'Hard landing likely.';
    case 'Needs baseline':
    default:
      return 'Still relying on baseline.';
  }
}

function drinkCountLabel(count: number): string {
  return `${count} drink${count === 1 ? '' : 's'}`;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
