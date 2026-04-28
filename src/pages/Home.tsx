import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Droplets,
  Moon,
  Sparkles,
  Utensils,
} from 'lucide-react';
import {
  FoodBowlArt,
  GlowPathArt,
  HeroStateArt,
  ParticlesArt,
  SleepIllustArt,
  WaterGlassArt,
} from '@/components/illustrations/EditorialArt';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import {
  buildReadinessSnapshot,
  buildTonightForecast,
  foodStatusForDay,
  sleepHoursForDay,
  waterGlassesForDay,
  type ReadinessSnapshot,
} from '@/lib/home';
import { isWithinDrinkCap } from '@/lib/drinkCap';
import { endedSessions, helperImpacts } from '@/lib/insights';
import { useDaily } from '@/store/useDaily';
import { useProfile } from '@/store/useProfile';
import { shouldShowMorningRecap, useSession } from '@/store/useSession';
import type { DailyFoodStatus, Session } from '@/types';

type Props = {
  onOpenSession: () => void;
  onOpenInsights: () => void;
  onOpenRecap: (sessionId: string) => void;
};

type HomeSheet = 'none' | 'sleep' | 'water' | 'dial' | 'why';
type HeroState = 'low' | 'mid' | 'high';

type DialState = {
  sleepOptimized: boolean;
  waterOptimized: boolean;
  foodOptimized: boolean;
  optimizedCount: number;
  remainingCount: number;
  waterProgress: number;
  sleepProgress: number;
  lineBonus: number;
};

type HomeAction =
  | {
      kind: 'recap';
      title: string;
      impact: string;
      helper: string;
      button: string;
      sessionId: string;
      visual: 'particles';
    }
  | {
      kind: 'sleep' | 'water' | 'food' | 'plan';
      title: string;
      impact: string;
      helper: string;
      button: string;
      visual: 'sleep' | 'water' | 'food' | 'path';
    };

export function HomePage({ onOpenSession, onOpenInsights, onOpenRecap }: Props) {
  const profile = useProfile((s) => s.profile)!;
  const active = useSession((s) => s.active);
  const history = useSession((s) => s.history);
  const now = useSession((s) => s.now);
  const tickNow = useSession((s) => s.tickNow);

  const hydrationByDay = useDaily((s) => s.hydrationByDay);
  const sleepByDay = useDaily((s) => s.sleepByDay);
  const foodByDay = useDaily((s) => s.foodByDay);
  const addHydration = useDaily((s) => s.addHydration);
  const setHydration = useDaily((s) => s.setHydration);
  const setSleep = useDaily((s) => s.setSleep);
  const setFood = useDaily((s) => s.setFood);

  const [sheet, setSheet] = useState<HomeSheet>('none');
  const [sleepDraft, setSleepDraft] = useState(8);
  const [waterDraft, setWaterDraft] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
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

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => setFeedback(null), 2800);
    return () => window.clearTimeout(id);
  }, [feedback]);

  const snapshot = useMemo(
    () =>
      buildReadinessSnapshot({
        profile,
        history,
        active,
        hydrationByDay,
        sleepByDay,
        foodByDay,
        atMs: now,
      }),
    [profile, history, active, hydrationByDay, sleepByDay, foodByDay, now],
  );

  const forecast = useMemo(
    () => buildTonightForecast(profile, history, now, snapshot.score),
    [profile, history, now, snapshot.score],
  );

  const todaySleepHours = sleepHoursForDay(sleepByDay, now);
  const todayWaterGlasses = waterGlassesForDay(hydrationByDay, now);
  const todayFood = foodStatusForDay(foodByDay, now);
  const dial = useMemo(
    () => buildDialState(snapshot, todaySleepHours, todayFood),
    [snapshot, todaySleepHours, todayFood],
  );
  const line = useMemo(
    () => buildHomeLine(forecast.suggestedEasyMorningLine, forecast.plan.drinksCap, dial.lineBonus),
    [forecast.suggestedEasyMorningLine, forecast.plan.drinksCap, dial.lineBonus],
  );
  const nextAction = useMemo(
    () =>
      buildNextAction({
        history,
        snapshot,
        todaySleepHours,
        todayWaterGlasses,
        todayFood,
        dial,
      }),
    [history, snapshot, todaySleepHours, todayWaterGlasses, todayFood, dial],
  );
  const latestEnded = useMemo(() => endedSessions(history)[0], [history]);
  const firstName = profile.name.split(' ')[0] || profile.name;
  const hero = buildHeroState(dial, nextAction, active !== null);

  function openSleepSheet() {
    setSleepDraft(todaySleepHours > 0 ? todaySleepHours : 7);
    setSheet('sleep');
  }

  function openWaterSheet() {
    setWaterDraft(todayWaterGlasses);
    setSheet('water');
  }

  function closeSheets() {
    setSheet('none');
  }

  function flash(message: string) {
    setFeedback(message);
  }

  function saveSleep() {
    setSleep(Number(sleepDraft.toFixed(1)), now);
    closeSheets();
    flash('Sleep logged. The night is getting sharper.');
  }

  function saveWater() {
    setHydration(Math.max(0, waterDraft), now);
    closeSheets();
    flash('Nice - hydration is improving the margin.');
  }

  function chooseFood(status: DailyFoodStatus) {
    setFood(status, now);
    flash(
      status === 'none'
        ? 'Food noted. We will keep the line steadier.'
        : 'Good move - absorption curve improves.',
    );
  }

  function handleNextAction(action: HomeAction) {
    if (action.kind === 'recap') {
      onOpenRecap(action.sessionId);
      return;
    }
    if (action.kind === 'sleep') {
      openSleepSheet();
      return;
    }
    if (action.kind === 'water') {
      addHydration(1, now);
      flash('Nice - one glass logged.');
      return;
    }
    if (action.kind === 'food') {
      chooseFood('solid');
      return;
    }
    onOpenSession();
  }

  return (
    <>
      <div className="max-w-[480px] mx-auto px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-28">
        <motion.section initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <LivingHeroCard
            firstName={firstName}
            greeting={greetingFor(now)}
            hero={hero}
            dial={dial}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="mt-3"
        >
          <NextBestStepCard
            action={nextAction}
            feedback={feedback}
            onAction={() => handleNextAction(nextAction)}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-3"
        >
          <LineTonightCard
            line={line}
            baseLine={forecast.suggestedEasyMorningLine}
            plannerCap={forecast.plan.drinksCap}
            active={active}
            onOpenWhy={() => setSheet('why')}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-3"
        >
          <DialInSummaryCard
            dial={dial}
            sleepHours={todaySleepHours}
            waterMl={snapshot.waterTodayMl}
            waterTargetMl={snapshot.waterTargetMl}
            food={todayFood}
            onOpen={() => setSheet('dial')}
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mt-3"
        >
          <YesterdayStrip
            session={latestEnded}
            onOpenRecap={onOpenRecap}
            onOpenInsights={onOpenInsights}
          />
        </motion.section>
      </div>

      <DialInSheet
        open={sheet === 'dial'}
        onClose={closeSheets}
        dial={dial}
        line={line}
        sleepHours={todaySleepHours}
        waterGlasses={todayWaterGlasses}
        waterTargetMl={snapshot.waterTargetMl}
        food={todayFood}
        onOpenSleep={openSleepSheet}
        onOpenWater={openWaterSheet}
        onQuickWater={(glasses) => {
          addHydration(glasses, now);
          flash(`Added ${glasses * 250}ml water.`);
        }}
        onChooseFood={chooseFood}
      />

      <SleepSheet
        open={sheet === 'sleep'}
        value={sleepDraft}
        onClose={closeSheets}
        onDecrease={() => setSleepDraft((value) => Math.max(0, roundToHalf(value - 0.5)))}
        onIncrease={() => setSleepDraft((value) => Math.min(12, roundToHalf(value + 0.5)))}
        onSelect={setSleepDraft}
        onSave={saveSleep}
      />

      <WaterSheet
        open={sheet === 'water'}
        glasses={waterDraft}
        onClose={closeSheets}
        onDecrease={() => setWaterDraft((value) => Math.max(0, value - 1))}
        onIncrease={() => setWaterDraft((value) => Math.min(20, value + 1))}
        onSelect={setWaterDraft}
        onSave={saveWater}
      />

      <WhyLineSheet
        open={sheet === 'why'}
        onClose={closeSheets}
        snapshot={snapshot}
        line={line}
        baseLine={forecast.suggestedEasyMorningLine}
        plannerCap={forecast.plan.drinksCap}
        expectedHours={forecast.expectedHours}
        plannedStartMs={forecast.plannedStartMs}
        wakeAtMs={forecast.wakeAtMs}
      />
    </>
  );
}

function LivingHeroCard({
  firstName,
  greeting,
  hero,
  dial,
}: {
  firstName: string;
  greeting: string;
  hero: { state: HeroState; title: string; body: string; pill: string };
  dial: DialState;
}) {
  return (
    <div className="relative min-h-[258px] overflow-hidden rounded-[28px] border border-line bg-bg-card shadow-card-lg">
      <HeroStateArt state={hero.state} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.78)_0%,rgba(15,23,42,0.28)_48%,rgba(15,23,42,0.82)_100%)]" />
      <div className="relative z-10 flex min-h-[258px] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-[25px] leading-[1.05] text-ink">
              {greeting},<br />
              <span className="italic text-accent">{firstName}.</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/12 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {hero.pill}
            </div>
          </div>
          <button
            type="button"
            className="h-9 w-9 rounded-full border border-line bg-bg-card/50 text-ink-muted backdrop-blur flex items-center justify-center"
            aria-label="Notifications"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div>
          <h1 className="font-display text-[28px] leading-[1.08] text-ink">
            {hero.title}
          </h1>
          <p className="mt-1.5 max-w-[250px] text-[13px] leading-snug text-ink">
            {hero.body}
          </p>
          <div className="mt-4 flex gap-1.5">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index < dial.optimizedCount ? 'bg-[#22C55E]' : 'bg-white/18'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NextBestStepCard({
  action,
  feedback,
  onAction,
}: {
  action: HomeAction;
  feedback: string | null;
  onAction: () => void;
}) {
  return (
    <Card className="rounded-[24px] p-3">
      <div className="grid grid-cols-[1fr_92px] gap-3">
        <div className="min-w-0">
          <div className="eyebrow !text-accent">NEXT BEST STEP</div>
          <h2 className="mt-2 font-display text-[24px] leading-[1.05] text-ink">
            {action.title}
          </h2>
          <div className="mt-1.5 text-[13px] font-semibold text-[#22C55E]">
            {action.impact}
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink-muted">
            {action.helper}
          </p>
        </div>
        <div className="relative min-h-[92px] overflow-hidden rounded-[18px] border border-line bg-bg-deep">
          <ActionVisual visual={action.visual} />
        </div>
      </div>

      <Button className="mt-3 w-full" size="md" onClick={onAction}>
        {action.button}
      </Button>

      <div className="mt-2 min-h-7 overflow-hidden rounded-full border border-line bg-bg-elev/45 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-dim">
        <AnimatePresence mode="wait">
          <motion.span
            key={feedback ?? action.kind}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="block"
          >
            {feedback ?? (action.kind === 'plan' ? 'Ready to lock in your line' : '1 more input to maximise your line')}
          </motion.span>
        </AnimatePresence>
      </div>
    </Card>
  );
}

function ActionVisual({ visual }: { visual: HomeAction['visual'] }) {
  if (visual === 'water') return <WaterGlassArt className="object-contain p-2" />;
  if (visual === 'food') return <FoodBowlArt className="object-contain p-1" />;
  if (visual === 'sleep') return <SleepIllustArt className="object-cover" />;
  if (visual === 'particles') return <ParticlesArt className="object-cover" />;
  return <GlowPathArt className="object-cover" />;
}

function LineTonightCard({
  line,
  baseLine,
  plannerCap,
  active,
  onOpenWhy,
}: {
  line: number;
  baseLine: number;
  plannerCap: number;
  active: Session | null;
  onOpenWhy: () => void;
}) {
  const cap = Math.max(1, Math.min(6, plannerCap));
  const progress = Math.max(0, Math.min(1, line / cap));
  const delta = Math.max(0, line - baseLine);

  return (
    <button
      type="button"
      onClick={onOpenWhy}
      className="w-full rounded-[22px] border border-line bg-bg-card p-3 text-left shadow-card transition hover:bg-bg-elev"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">YOUR LINE TONIGHT</div>
          <div className="mt-2 flex items-end gap-2">
            <div className="font-display text-[42px] leading-none text-ink">
              {active ? active.drinks.length.toFixed(1) : line.toFixed(1)}
            </div>
            <div className="pb-1.5 text-[13px] text-ink">drinks</div>
            {delta > 0.05 && (
              <span className="mb-2 rounded-full bg-[#22C55E]/14 px-2 py-1 font-mono text-[10px] text-[#86EFAC]">
                +{delta.toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <span className="rounded-full bg-accent/12 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-accent">
          In your zone
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <span className="font-mono text-[10px] text-ink-dim">0</span>
        <div className="relative h-2 rounded-full bg-bg-elev">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#6366F1,#7C5CFF)]"
            style={{ width: `${progress * 100}%` }}
          />
          <span
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-ink-dim">{cap}</span>
      </div>
    </button>
  );
}

function DialInSummaryCard({
  dial,
  sleepHours,
  waterMl,
  waterTargetMl,
  food,
  onOpen,
}: {
  dial: DialState;
  sleepHours: number;
  waterMl: number;
  waterTargetMl: number;
  food: DailyFoodStatus | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[22px] border border-line bg-bg-card p-3 text-left shadow-card transition hover:bg-bg-elev"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="eyebrow">DIAL IN TONIGHT</div>
        <div className="font-mono text-[10px] text-accent">
          {dial.optimizedCount} / 3 optimised
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <DialMini
          icon={<Moon className="h-4 w-4" />}
          label="Sleep"
          value={sleepHours > 0 ? `${sleepHours.toFixed(1)}h` : 'Not set'}
          done={dial.sleepOptimized}
          tone={dial.sleepOptimized ? 'success' : 'warning'}
        />
        <DialMini
          icon={<Droplets className="h-4 w-4" />}
          label="Water"
          value={`${(waterMl / 1000).toFixed(1)} / ${(waterTargetMl / 1000).toFixed(1)}L`}
          done={dial.waterOptimized}
          tone={dial.waterOptimized ? 'success' : 'info'}
        />
        <DialMini
          icon={<Utensils className="h-4 w-4" />}
          label="Food"
          value={foodLabel(food)}
          done={dial.foodOptimized}
          tone={dial.foodOptimized ? 'success' : 'warning'}
        />
      </div>
    </button>
  );
}

function DialMini({
  icon,
  label,
  value,
  done,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  done: boolean;
  tone: 'success' | 'warning' | 'info';
}) {
  const color =
    tone === 'success' ? 'text-[#22C55E]' : tone === 'warning' ? 'text-[#F59E0B]' : 'text-sky';
  return (
    <div className="rounded-[16px] border border-line bg-bg-elev/50 p-2">
      <div className={`flex items-center justify-between ${color}`}>
        {icon}
        {done && <Check className="h-3.5 w-3.5" />}
      </div>
      <div className="mt-2 text-[11px] font-semibold text-ink">{label}</div>
      <div className="mt-0.5 truncate text-[10px] text-ink-muted">{value}</div>
    </div>
  );
}

function YesterdayStrip({
  session,
  onOpenRecap,
  onOpenInsights,
}: {
  session: Session | undefined;
  onOpenRecap: (sessionId: string) => void;
  onOpenInsights: () => void;
}) {
  if (!session) {
    return (
      <Card className="rounded-[20px] p-3">
        <div className="eyebrow">YESTERDAY</div>
        <div className="mt-1 font-display text-[19px] leading-tight text-ink">
          Your patterns will appear after a few recaps.
        </div>
        <button
          type="button"
          onClick={onOpenInsights}
          className="mt-2 text-[12px] font-semibold text-accent"
        >
          Start with one night
        </button>
      </Card>
    );
  }

  const within = isWithinDrinkCap(session);
  const rating = session.recap?.rating;
  const title = within === false ? 'Went over your line' : 'Stayed within your line';
  const body = rating
    ? `${rating}/5 morning${rating >= 4 ? ' - better morning' : ' - try pacing earlier'}`
    : 'Recap missing - finish the loop';

  return (
    <button
      type="button"
      onClick={() => (session.recap ? onOpenInsights() : onOpenRecap(session.id))}
      className="grid w-full grid-cols-[58px_1fr_auto] items-center gap-3 rounded-[20px] border border-line bg-bg-card p-3 text-left shadow-card transition hover:bg-bg-elev"
    >
      <div className="h-14 overflow-hidden rounded-[16px] border border-line">
        <HeroStateArt state={rating && rating >= 4 ? 'high' : 'mid'} />
      </div>
      <div className="min-w-0">
        <div className="eyebrow">YESTERDAY</div>
        <div className="mt-1 truncate text-[15px] font-semibold text-ink">{title}</div>
        <div className={`mt-0.5 text-[12px] ${rating && rating < 4 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
          {body}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-ink-dim" />
    </button>
  );
}

function DialInSheet({
  open,
  onClose,
  dial,
  line,
  sleepHours,
  waterGlasses,
  waterTargetMl,
  food,
  onOpenSleep,
  onOpenWater,
  onQuickWater,
  onChooseFood,
}: {
  open: boolean;
  onClose: () => void;
  dial: DialState;
  line: number;
  sleepHours: number;
  waterGlasses: number;
  waterTargetMl: number;
  food: DailyFoodStatus | null;
  onOpenSleep: () => void;
  onOpenWater: () => void;
  onQuickWater: (glasses: number) => void;
  onChooseFood: (status: DailyFoodStatus) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Dial in tonight">
      <div className="space-y-3">
        <p className="text-[13px] text-ink-muted">Small inputs. Big impact.</p>

        <DialFactorCard
          icon={<Moon className="h-5 w-5" />}
          title="Sleep"
          status={sleepHours > 0 ? `${sleepHours.toFixed(1)}h` : 'Not logged'}
          done={dial.sleepOptimized}
          onClick={onOpenSleep}
        />

        <div className="rounded-[20px] border border-line bg-bg-elev/60 p-3">
          <button
            type="button"
            onClick={onOpenWater}
            className="flex w-full items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-sky/10 text-sky">
              <Droplets className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink">Water</div>
              <div className="text-[12px] text-ink-muted">
                {(waterGlasses * 0.25).toFixed(1)}L / {(waterTargetMl / 1000).toFixed(1)}L
              </div>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F59E0B]/15 text-[#F59E0B]">
              <ChevronDown className="h-4 w-4" />
            </div>
          </button>
          <div className="mt-3 rounded-[16px] border border-line bg-bg-card p-3">
            <div className="text-[12px] font-semibold text-ink">Why it matters</div>
            <p className="mt-1 text-[12px] leading-snug text-ink-muted">
              Hydration keeps your body in balance and reduces next-day fatigue.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[1, 2, 4].map((glasses) => (
                <Button key={glasses} size="sm" onClick={() => onQuickWater(glasses)}>
                  +{glasses * 250}ml
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-bg-elev/60 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#22C55E]/10 text-[#22C55E]">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink">Food</div>
              <div className="text-[12px] text-ink-muted">{foodLabel(food)}</div>
            </div>
            {dial.foodOptimized && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#22C55E]/15 text-[#22C55E]">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-[14px] border border-line bg-bg-card">
            {foodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChooseFood(option.value)}
                className={`px-2 py-3 text-[11px] font-semibold transition ${
                  food === option.value
                    ? 'bg-accent text-white'
                    : 'text-ink-muted hover:bg-bg-elev'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[20px] border border-line bg-bg-card p-3">
          <div className="eyebrow">LIVE IMPACT</div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <Metric label="Inputs" value={`${dial.optimizedCount}/3`} />
            <Metric label="Line" value={line.toFixed(1)} />
            <Metric label="Outlook" value={dial.optimizedCount >= 2 ? '4/5' : '3/5'} />
          </div>
        </div>
      </div>
    </Sheet>
  );
}

function DialFactorCard({
  icon,
  title,
  status,
  done,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[20px] border border-line bg-bg-elev/60 p-3 text-left"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-ink">{title}</div>
        <div className="text-[12px] text-ink-muted">{status}</div>
      </div>
      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-[#22C55E]/15 text-[#22C55E]' : 'bg-bg-card text-ink-dim'}`}>
        {done ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </div>
    </button>
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
    <Sheet open={open} onClose={onClose} title="Last night's sleep">
      <div className="overflow-hidden rounded-[22px] border border-line bg-bg-deep">
        <SleepIllustArt className="h-28" />
      </div>
      <EntrySheetValue value={`${value.toFixed(1)}h`} sub="Sleep improves recovery and your line." />
      <StepperRow onDecrease={onDecrease} onIncrease={onIncrease} />
      <div className="mt-5 grid grid-cols-5 gap-2">
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
      <Button className="mt-6 w-full" size="lg" onClick={onSave}>
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
      <div className="mx-auto h-32 w-32">
        <WaterGlassArt className="object-contain" />
      </div>
      <EntrySheetValue value={`${(glasses * 0.25).toFixed(1)}L`} sub="Each step is one 250ml glass." />
      <StepperRow onDecrease={onDecrease} onIncrease={onIncrease} />
      <div className="mt-5 grid grid-cols-4 gap-2">
        {[1, 2, 4, 6].map((preset) => (
          <QuickOption key={preset} active={glasses === preset} onClick={() => onSelect(preset)}>
            {(preset * 0.25).toFixed(1)}L
          </QuickOption>
        ))}
      </div>
      <Button className="mt-6 w-full" size="lg" onClick={onSave}>
        Save water
      </Button>
    </Sheet>
  );
}

function WhyLineSheet({
  open,
  onClose,
  snapshot,
  line,
  baseLine,
  plannerCap,
  expectedHours,
  plannedStartMs,
  wakeAtMs,
}: {
  open: boolean;
  onClose: () => void;
  snapshot: ReadinessSnapshot;
  line: number;
  baseLine: number;
  plannerCap: number;
  expectedHours: number;
  plannedStartMs: number;
  wakeAtMs: number;
}) {
  const startLabel = new Date(plannedStartMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const wakeLabel = new Date(wakeAtMs).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const topLever = weakestLever(snapshot);

  return (
    <Sheet open={open} onClose={onClose} title="Why this line?">
      <div className="space-y-3">
        <div className="rounded-[20px] border border-line bg-bg-elev p-4">
          <div className="eyebrow">THE LINE</div>
          <div className="mt-2 font-display text-[40px] leading-none text-ink">
            {line.toFixed(1)} drinks
          </div>
          <p className="mt-2 text-[13px] leading-snug text-ink-muted">
            The baseline line is {baseLine.toFixed(1)}. Today’s inputs can unlock up to the planner ceiling of {plannerCap} drinks.
          </p>
        </div>
        <div className="rounded-[20px] border border-line bg-bg-card p-4">
          <div className="eyebrow">BIGGEST LEVER</div>
          <div className="mt-2 font-display text-[25px] leading-tight text-ink">{topLever.title}</div>
          <p className="mt-2 text-[13px] leading-snug text-ink-muted">{topLever.body}</p>
        </div>
        <div className="rounded-[20px] border border-line bg-bg-card p-4">
          <div className="eyebrow">ASSUMPTIONS</div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Metric label="Start" value={startLabel} />
            <Metric label="Duration" value={`${expectedHours}h`} />
            <Metric label="Wake" value={wakeLabel} />
          </div>
          <p className="mt-4 text-[11px] leading-snug text-ink-dim">
            Estimates only. This is not permission to drive or a guarantee of how you will feel.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function EntrySheetValue({ value, sub }: { value: string; sub: string }) {
  return (
    <div className="mt-4 text-center">
      <div className="font-display text-[52px] leading-none text-ink">{value}</div>
      <div className="mt-2 text-[14px] leading-snug text-ink-muted">{sub}</div>
    </div>
  );
}

function StepperRow({ onDecrease, onIncrease }: { onDecrease: () => void; onIncrease: () => void }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
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
      className={`rounded-2xl px-2 py-3 font-mono text-[10px] uppercase tracking-[0.12em] transition ${
        active
          ? 'border border-accent bg-accent/12 text-accent'
          : 'border border-line bg-bg-card text-ink-dim hover:bg-bg-elev'
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-dim">{label}</div>
      <div className="mt-1 font-display text-[20px] leading-none text-ink">{value}</div>
    </div>
  );
}

const foodOptions: { value: DailyFoodStatus; label: string }[] = [
  { value: 'none', label: "Didn't eat" },
  { value: 'light', label: 'Light meal' },
  { value: 'solid', label: 'Solid meal' },
];

function buildDialState(
  snapshot: ReadinessSnapshot,
  sleepHours: number,
  food: DailyFoodStatus | null,
): DialState {
  const sleepProgress = Math.max(0, Math.min(1, sleepHours / 7.5));
  const waterProgress =
    snapshot.waterTargetMl > 0
      ? Math.max(0, Math.min(1, snapshot.waterTodayMl / snapshot.waterTargetMl))
      : 0;
  const sleepOptimized = sleepHours >= 6.5;
  const waterOptimized = waterProgress >= 0.7;
  const foodOptimized = food === 'light' || food === 'solid';
  const optimizedCount = [sleepOptimized, waterOptimized, foodOptimized].filter(Boolean).length;
  const lineBonus =
    (sleepOptimized ? 0.2 : 0) +
    (waterOptimized ? 0.3 : 0) +
    (food === 'solid' ? 0.4 : food === 'light' ? 0.2 : 0);

  return {
    sleepOptimized,
    waterOptimized,
    foodOptimized,
    optimizedCount,
    remainingCount: 3 - optimizedCount,
    waterProgress,
    sleepProgress,
    lineBonus,
  };
}

function buildHomeLine(baseLine: number, plannerCap: number, bonus: number): number {
  return Math.max(0, Math.min(plannerCap, Math.round((baseLine + bonus) * 10) / 10));
}

function buildHeroState(
  dial: DialState,
  action: HomeAction,
  hasActiveSession: boolean,
): { state: HeroState; title: string; body: string; pill: string } {
  if (hasActiveSession) {
    return {
      state: 'mid',
      title: 'Session in progress',
      body: "We've got your back.",
      pill: 'Tracking now',
    };
  }
  if (dial.optimizedCount >= 3) {
    return {
      state: 'high',
      title: "You're dialled in",
      body: "You're set for a strong night.",
      pill: 'Dialled in',
    };
  }
  if (dial.optimizedCount >= 2) {
    return {
      state: 'mid',
      title: 'Nice progress',
      body: 'Keep it up.',
      pill: 'Drinking tonight',
    };
  }
  return {
    state: 'low',
    title: action.kind === 'recap' ? 'Close the loop' : `${Math.max(1, dial.remainingCount)} step${dial.remainingCount === 1 ? '' : 's'} to improve your night`,
    body: 'Add a few inputs to personalise your line.',
    pill: 'Drinking tonight',
  };
}

function buildNextAction({
  history,
  snapshot,
  todaySleepHours,
  todayWaterGlasses,
  todayFood,
  dial,
}: {
  history: Session[];
  snapshot: ReadinessSnapshot;
  todaySleepHours: number;
  todayWaterGlasses: number;
  todayFood: DailyFoodStatus | null;
  dial: DialState;
}): HomeAction {
  const unrecapped = endedSessions(history)
    .filter((session) => shouldShowMorningRecap(session))
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))[0];

  if (unrecapped) {
    return {
      kind: 'recap',
      sessionId: unrecapped.id,
      title: "Finish yesterday's recap",
      impact: 'Improves today recommendation',
      helper: 'One minute closes the loop.',
      button: 'Complete recap',
      visual: 'particles',
    };
  }

  if (todaySleepHours <= 0) {
    return {
      kind: 'sleep',
      title: 'Log sleep',
      impact: '+0.2 drinks unlocked',
      helper: 'Better accuracy.',
      button: 'Log sleep',
      visual: 'sleep',
    };
  }

  if (todayWaterGlasses <= 0 || dial.waterProgress < 0.7) {
    return {
      kind: 'water',
      title: 'Add 250ml water',
      impact: '+0.3 drinks unlocked',
      helper: 'Better morning likelihood.',
      button: 'Drink a glass now',
      visual: 'water',
    };
  }

  if (!todayFood || todayFood === 'none') {
    return {
      kind: 'food',
      title: 'Confirm food',
      impact: 'Slower absorption',
      helper: 'Better control tonight.',
      button: 'Solid meal',
      visual: 'food',
    };
  }

  const hydration = helperImpacts(history).find((item) => item.label === 'Staying on water');
  return {
    kind: 'plan',
    title: dial.optimizedCount >= 3 ? "View tonight's plan" : 'Plan tonight',
    impact: hydration ? `+${hydration.delta.toFixed(1)} better mornings` : `${snapshot.band.label}`,
    helper: 'Lock in a sensible line.',
    button: "View tonight's plan",
    visual: 'path',
  };
}

function weakestLever(snapshot: ReadinessSnapshot): { title: string; body: string } {
  const weakest = [...snapshot.factors].sort((a, b) => a.normalized - b.normalized)[0];
  if (weakest.key === 'hydration') {
    return {
      title: 'Hydration is the quickest win.',
      body: `You are at ${(snapshot.waterTodayMl / 1000).toFixed(1)}L today. A glass now helps the margin and the morning.`,
    };
  }
  if (weakest.key === 'sleep') {
    return {
      title: 'Sleep is setting the tone.',
      body: `${snapshot.sleepTodayHours.toFixed(1)}h is the biggest missing signal for tonight's plan.`,
    };
  }
  if (weakest.key === 'recovery') {
    return {
      title: 'Recovery is still building.',
      body: `${snapshot.daysSinceLastDrink} dry day${snapshot.daysSinceLastDrink === 1 ? '' : 's'} means the buffer is still coming back.`,
    };
  }
  return {
    title: 'Recent load is shrinking the buffer.',
    body: `${snapshot.drinks7dSum.toFixed(1)} standard drinks over the last 7 days lowers tonight's ceiling.`,
  };
}

function foodLabel(food: DailyFoodStatus | null): string {
  if (food === 'solid') return 'Ate well';
  if (food === 'light') return 'Light meal';
  if (food === 'none') return 'Not eating';
  return 'Not set';
}

function greetingFor(now: number): string {
  const hour = new Date(now).getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}
