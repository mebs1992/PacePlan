import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WaterAlert } from '@/components/WaterAlert';
import { CutoffBanner } from '@/components/CutoffBanner';
import { HangoverCard } from '@/components/HangoverCard';
import { SessionMeta } from '@/components/SessionMeta';
import { FAB } from '@/components/FAB';
import { NightCurve } from '@/components/NightCurve';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { TrackerSheet, type TrackerTab } from '@/components/TrackerSheet';
import { ConfirmEndSheet } from '@/components/ConfirmEndSheet';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import {
  BETA_TYPICAL,
  bacCurve,
  computeBacAt,
  computeBacRange,
  drinksUntilHangover,
  hangoverLabel,
  hangoverRiskFor,
  peakBacInWindow,
  recommendCutoff,
  riskFor,
  soberAtMs,
  suggestedDrinksRemaining,
  waterBehind,
  waterDeficit,
} from '@/lib/bac';
import { formatClockWithDay } from '@/lib/time';
import type { RiskLevel } from '@/types';
import { motion } from 'framer-motion';
import { Car, MoreHorizontal, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
): { text: string; color: string } {
  if (planToDrive && risk === 'red')
    return { text: 'Do not drive.', color: RISK_COLOR.red };
  if (planToDrive && risk === 'yellow')
    return { text: 'Plan a ride.', color: RISK_COLOR.yellow };
  if (bac <= 0.001) return { text: 'Safe to drive.', color: RISK_COLOR.green };
  if (hangoverSevere)
    return { text: 'Rough morning incoming.', color: RISK_COLOR.red };
  if (risk === 'red') return { text: 'Do not drive.', color: RISK_COLOR.red };
  if (risk === 'yellow') return { text: 'Ease up.', color: RISK_COLOR.yellow };
  return { text: 'Pacing well.', color: RISK_COLOR.green };
}

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

  const [trackerTab, setTrackerTab] = useState<TrackerTab | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

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

  if (!active) {
    return <StartSession profileName={profile.name} onStart={startSession} />;
  }

  const inputs = {
    profile,
    drinks: active.drinks,
    food: active.food,
    at: now,
  };
  const range = computeBacRange(inputs);
  const risk = riskFor(range.typical);
  const sober = soberAtMs(inputs);
  const sessionEndsAt = active.startedAt + active.expectedHours * 60 * 60 * 1000;
  const cutoff = recommendCutoff(inputs, sessionEndsAt);
  const behind = waterBehind(active.drinks, active.water.length);
  const deficit = waterDeficit(active.drinks, active.water.length);
  const planToDrive = active.planToDrive ?? false;
  const wakeAtMs = active.wakeAtMs;

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
    active.startedAt,
    Math.max(sessionEndsAt, wakeAtMs ?? sessionEndsAt),
  );
  const hRisk = hangoverRiskFor(sessionPeak, bacAtWake, deficit);
  const hangoverDrinksLeft = wakeAtMs
    ? drinksUntilHangover(inputs, sessionEndsAt, wakeAtMs)
    : null;
  const legalDrinksLeft = suggestedDrinksRemaining(inputs, sessionEndsAt, 1.4, 0.045);

  const curve = useMemo(
    () =>
      bacCurve(
        profile,
        active.drinks,
        active.food,
        active.startedAt,
        Math.max(sessionEndsAt, (wakeAtMs ?? 0) + 60_000, now + 60_000),
        100,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, active.drinks, active.food, active.startedAt, sessionEndsAt, wakeAtMs],
  );

  const advisory = advisoryFor(risk, range.typical, hRisk === 'severe', planToDrive);

  const dateLabel = new Date(active.startedAt)
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const firstName = profile.name.split(' ')[0] || profile.name;

  const openTracker = (tab: TrackerTab) => setTrackerTab(tab);
  const closeTracker = () => setTrackerTab(null);

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
        <DrivingChip value={planToDrive} onChange={setPlanToDrive} />
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
          sessionStart={active.startedAt}
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
          title="SOBER BY"
          big={sober ? formatClockWithDay(sober, now) : '—'}
          sub="est. clearance"
          flavor="0.00% BAC"
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
          startedAt={active.startedAt}
          expectedHours={active.expectedHours}
          wakeAtMs={wakeAtMs}
          now={now}
          onChangeHours={setExpectedHours}
          onChangeWake={setWakeAt}
        />
      </div>

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
        onAddDrink={addDrink}
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
        peak={peakBacInWindow(
          profile,
          active.drinks,
          active.food,
          active.startedAt,
          Date.now(),
        )}
        onConfirm={() => {
          const peak = peakBacInWindow(
            profile,
            active.drinks,
            active.food,
            active.startedAt,
            Date.now(),
          );
          setConfirmEnd(false);
          endSession(peak, hRisk);
        }}
      />
    </div>
  );
}

function DrivingChip({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={cn(
        'shrink-0 h-10 w-10 rounded-2xl inline-flex items-center justify-center border transition relative',
        value
          ? 'bg-risk-red text-white border-risk-red shadow-press'
          : 'bg-bg-card text-ink-muted border-line hover:bg-bg-elev',
      )}
      aria-label={value ? 'Driving tonight' : 'Not driving'}
    >
      {value ? (
        <Car className="h-4 w-4" />
      ) : (
        <MoreHorizontal className="h-4 w-4" />
      )}
    </button>
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

function StartSession({
  profileName,
  onStart,
}: {
  profileName: string;
  onStart: (h: number, opts?: { wakeAtMs?: number; planToDrive?: boolean }) => void;
}) {
  const [hours, setHours] = useState(4);
  const [wakeDraft, setWakeDraft] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
  });
  const [useWake, setUseWake] = useState(true);
  const [driving, setDriving] = useState(false);

  const wakeMs = useMemo(() => {
    const n = new Date(wakeDraft).getTime();
    return Number.isFinite(n) ? n : undefined;
  }, [wakeDraft]);

  const today = new Date()
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();
  const firstName = profileName.split(' ')[0] || profileName;

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-28">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="eyebrow">TONIGHT · {today}</div>
        <h1 className="font-display text-[44px] leading-[1.02] tracking-[-0.03em] text-ink mt-1">
          Hi, <span className="italic text-accent">{firstName}.</span>
        </h1>
        <p className="font-display italic text-ink-muted text-[18px] mt-3">
          A quiet companion for loud nights.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="text-center">
          <div className="eyebrow">EXPECTED DURATION</div>
          <div className="font-display tabular-nums text-ink my-3 leading-none tracking-[-0.03em]" style={{ fontSize: 88, fontWeight: 300 }}>
            {hours}
            <span className="font-display text-[32px] text-ink-muted ml-1">h</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between font-mono text-[10px] text-ink-dim mt-2 px-1">
            <span>1h</span>
            <span>6h</span>
            <span>12h</span>
          </div>

          <div className="mt-6 text-left">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink">Wake up time</label>
              <button
                type="button"
                onClick={() => setUseWake((v) => !v)}
                className="font-mono text-[11px] text-accent uppercase tracking-wider hover:underline underline-offset-2"
              >
                {useWake ? "I'll sleep in" : 'Set a time'}
              </button>
            </div>
            {useWake ? (
              <input
                type="datetime-local"
                value={wakeDraft}
                onChange={(e) => setWakeDraft(e.target.value)}
                className="w-full h-11 px-3 mt-2 rounded-xl bg-bg-card border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
            ) : (
              <div className="mt-2 font-display italic text-ink-dim text-sm">
                Whenever — we'll only track sober time.
              </div>
            )}
          </div>

          <div className="mt-5 text-left">
            <label className="text-sm font-semibold text-ink">Do you plan on driving?</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDriving(false)}
                className={`h-11 rounded-xl text-sm font-semibold min-tap transition-all ${
                  !driving
                    ? 'bg-ink text-white'
                    : 'bg-bg-card border border-line text-ink-muted'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5" />
                  No
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDriving(true)}
                className={`h-11 rounded-xl text-sm font-semibold min-tap transition-all ${
                  driving
                    ? 'bg-risk-red text-white'
                    : 'bg-bg-card border border-line text-ink-muted'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5" />
                  Yes
                </span>
              </button>
            </div>
          </div>

          <Button
            className="w-full mt-6 font-display italic text-[20px]"
            size="lg"
            onClick={() =>
              onStart(hours, {
                wakeAtMs: useWake ? wakeMs : undefined,
                planToDrive: driving,
              })
            }
          >
            Start the night
          </Button>
        </Card>
      </motion.div>

      <p className="font-mono text-[10px] text-ink-dim text-center mt-4 uppercase tracking-wider">
        Estimates only. Never drive after drinking.
      </p>
    </div>
  );
}
