import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Beer,
  Droplets,
  GlassWater,
  MoonStar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { computeBacRange, riskFor } from '@/lib/bac';
import {
  buildTonightForecast,
  hydrationBand,
  hydrationForDay,
  hydrationScore,
  hydrationStreak,
  hydrationTargetDays,
  HYDRATION_TARGET_GLASSES,
  noDrinkStreak,
  recentRecoveryCopy,
} from '@/lib/home';
import { formatClock, formatClockWithDay } from '@/lib/time';
import { useDaily } from '@/store/useDaily';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';

type Props = {
  onOpenSession: () => void;
  onOpenInsights: () => void;
};

export function HomePage({ onOpenSession, onOpenInsights }: Props) {
  const profile = useProfile((s) => s.profile)!;
  const active = useSession((s) => s.active);
  const history = useSession((s) => s.history);
  const now = useSession((s) => s.now);
  const tickNow = useSession((s) => s.tickNow);
  const hydrationByDay = useDaily((s) => s.hydrationByDay);
  const addHydration = useDaily((s) => s.addHydration);
  const removeHydration = useDaily((s) => s.removeHydration);

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

  const todayHydration = hydrationForDay(hydrationByDay, now);
  const score = hydrationScore(todayHydration);
  const hydrationState = hydrationBand(score);
  const streak = hydrationStreak(hydrationByDay, now);
  const weeklyHits = hydrationTargetDays(hydrationByDay, now);
  const dryStreak = noDrinkStreak(history, now);
  const tonightForecast = useMemo(
    () => buildTonightForecast(profile, history, now),
    [profile, history, now]
  );

  const activeRange = active
    ? computeBacRange({
        profile,
        drinks: active.drinks,
        food: active.food,
        at: now,
      })
    : null;

  const firstName = profile.name.split(' ')[0] || profile.name;
  const todayLabel = new Date(now)
    .toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toUpperCase();

  return (
    <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="eyebrow">OVERVIEW · {todayLabel}</div>
        <h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.03em] text-ink mt-2">
          Steady, <span className="italic text-accent">{firstName}.</span>
        </h1>
        <p className="font-display italic text-[17px] text-ink-muted mt-3 leading-snug">
          {active
            ? 'You have a live session running. Dip back in or use today to keep the edges soft.'
            : recentRecoveryCopy(history, now)}
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04 }}
      >
        <Card className="overflow-hidden p-0">
          <div className="bg-[linear-gradient(135deg,rgba(140,58,42,0.09),rgba(178,128,52,0.05)_52%,rgba(255,255,255,0.9)_100%)] px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow">TODAY'S PULSE</div>
                <div className="font-display text-[28px] leading-[1.05] text-ink mt-2">
                  {active ? 'Session underway.' : hydrationState.label}
                </div>
              </div>
              <div className="rounded-full border border-line bg-white/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                {active
                  ? `${active.drinks.length} drinks logged`
                  : `${todayHydration}/${HYDRATION_TARGET_GLASSES} glasses`}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <PulseChip
                icon={Droplets}
                label={streak > 0 ? `${streak} day hydration streak` : 'Log water to start a streak'}
              />
              <PulseChip
                icon={MoonStar}
                label={
                  dryStreak > 1
                    ? `${dryStreak} dry days`
                    : dryStreak === 1
                      ? 'Dry today'
                      : 'Night out recently'
                }
              />
              <PulseChip
                icon={TrendingUp}
                label={`${weeklyHits}/7 target days`}
              />
            </div>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row">
            {active ? (
              <>
                <Button className="flex-1" size="lg" onClick={onOpenSession}>
                  Back to session
                </Button>
                <div className="flex-1 rounded-2xl border border-line bg-bg-elev px-4 py-3">
                  <div className="eyebrow mb-2">CURRENT BAC</div>
                  <div
                    className={`font-display tabular-nums text-[30px] leading-none ${
                      activeRange ? riskToneClass(riskFor(activeRange.typical)) : 'text-ink'
                    }`}
                  >
                    {activeRange ? activeRange.typical.toFixed(3) : '—'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Button className="flex-1" size="lg" onClick={onOpenSession}>
                  Start session
                </Button>
                <Button className="flex-1" size="lg" variant="secondary" onClick={onOpenInsights}>
                  See patterns
                </Button>
              </>
            )}
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mt-4"
      >
        <Card className="rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">HYDRATION SCORE</div>
              <div className="font-display text-[34px] leading-[1.02] tracking-[-0.02em] text-ink mt-2">
                {score}
                <span className="text-[20px] text-ink-muted ml-1">/100</span>
              </div>
              <p className="font-display italic text-[15px] text-ink-muted mt-2 leading-snug max-w-[18rem]">
                {hydrationState.message}
              </p>
            </div>
            <HydrationDial score={score} accent={hydrationState.accent} />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
              <span>Today</span>
              <span>{todayHydration} of {HYDRATION_TARGET_GLASSES} glasses</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-bg-elev overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (todayHydration / HYDRATION_TARGET_GLASSES) * 100)}%`,
                  backgroundColor: hydrationState.accent,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <QuickWaterButton
              icon={GlassWater}
              label="+250mL"
              sub="1 glass"
              onClick={() => addHydration(1)}
            />
            <QuickWaterButton
              icon={Droplets}
              label="+500mL"
              sub="2 glasses"
              onClick={() => addHydration(2)}
            />
            <QuickWaterButton
              icon={ArrowRight}
              label="Undo"
              sub="last glass"
              onClick={() => removeHydration(1)}
            />
          </div>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mt-4"
      >
        <Card className="rounded-[24px] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow">IF YOU DRINK TONIGHT</div>
              <h2 className="font-display text-[28px] leading-[1.06] tracking-[-0.02em] text-ink mt-2">
                Keep it to about{' '}
                <span className="text-accent">
                  {tonightForecast.plan.drinksCap || '0'}
                </span>{' '}
                rounds.
              </h2>
            </div>
            <div className="rounded-full border border-line bg-bg-elev px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted shrink-0">
              <Beer className="inline h-3.5 w-3.5 mr-1.5" />
              {tonightForecast.expectedHours}h plan
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <ForecastStat label="Start" value={formatClock(tonightForecast.plannedStartMs)} />
            <ForecastStat
              label="Peak"
              value={tonightForecast.plan.peakBac.toFixed(3)}
              tone={riskToneClass(riskFor(tonightForecast.plan.peakBac))}
            />
            <ForecastStat
              label="Pace"
              value={
                tonightForecast.plan.minutesPerDrink
                  ? `~${tonightForecast.plan.minutesPerDrink}m`
                  : 'skip'
              }
            />
          </div>

          <div className="mt-4 rounded-[20px] border border-line bg-bg-elev px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-display text-[16px] leading-tight text-ink">
                Forecast assumes a meal, no driving, and lights out by{' '}
                {formatClockWithDay(tonightForecast.wakeAtMs, now)}.
              </div>
              <Sparkles className="h-5 w-5 text-accent shrink-0" />
            </div>
            <p className="font-mono text-[11px] text-ink-dim mt-2 leading-relaxed tracking-tight">
              {hydrationState.message}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button className="flex-1" onClick={onOpenSession}>
              Open tonight planner
            </Button>
            <Button className="flex-1" variant="secondary" onClick={onOpenInsights}>
              Why this matters
            </Button>
          </div>
        </Card>
      </motion.section>
    </div>
  );
}

function PulseChip({
  icon: Icon,
  label,
}: {
  icon: typeof Droplets;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-accent" />
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
    </div>
  );
}

function HydrationDial({ score, accent }: { score: number; accent: string }) {
  const theta = Math.max(0, Math.min(100, score));
  return (
    <div
      className="h-[92px] w-[92px] shrink-0 rounded-full border border-line flex items-center justify-center"
      style={{
        background: `conic-gradient(${accent} 0 ${theta}%, rgba(212,199,168,0.55) ${theta}% 100%)`,
      }}
    >
      <div className="h-[72px] w-[72px] rounded-full bg-bg-card border border-line flex items-center justify-center">
        <div className="font-mono text-[13px] tabular-nums text-ink">{score}%</div>
      </div>
    </div>
  );
}

function QuickWaterButton({
  icon: Icon,
  label,
  sub,
  onClick,
}: {
  icon: typeof GlassWater;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-line bg-bg-card px-3 py-3 text-left hover:bg-bg-elev active:bg-bg-deep transition min-tap"
    >
      <Icon className="h-4 w-4 text-accent" />
      <div className="font-display text-[15px] text-ink mt-2 leading-none">{label}</div>
      <div className="font-mono text-[10px] text-ink-dim mt-1 uppercase tracking-[0.16em]">
        {sub}
      </div>
    </button>
  );
}

function ForecastStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[18px] border border-line bg-bg-elev px-3 py-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-dim">
        {label}
      </div>
      <div className={`font-display text-[24px] leading-none mt-2 ${tone ?? 'text-ink'}`}>
        {value}
      </div>
    </div>
  );
}

function riskToneClass(risk: ReturnType<typeof riskFor>): string {
  switch (risk) {
    case 'green':
      return 'text-risk-green';
    case 'yellow':
      return 'text-risk-yellow';
    case 'red':
      return 'text-risk-red';
  }
}
