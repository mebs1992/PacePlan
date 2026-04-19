import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACGauge } from '@/components/BACGauge';
import { WaterAlert } from '@/components/WaterAlert';
import { CutoffBanner } from '@/components/CutoffBanner';
import { HangoverCard } from '@/components/HangoverCard';
import { SessionMeta } from '@/components/SessionMeta';
import { FAB } from '@/components/FAB';
import { TrackerSheet, type TrackerTab } from '@/components/TrackerSheet';
import { ConfirmEndSheet } from '@/components/ConfirmEndSheet';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import {
  BETA_TYPICAL,
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
import { motion } from 'framer-motion';
import { Car, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const openTracker = (tab: TrackerTab) => setTrackerTab(tab);
  const closeTracker = () => setTrackerTab(null);

  return (
    <div className="max-w-md mx-auto p-4 pb-32">
      <header className="mt-6 mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink tracking-tight truncate">
          Hi, {profile.name}
        </h1>
        <DrivingChip value={planToDrive} onChange={setPlanToDrive} />
      </header>

      {behind && (
        <div className="mb-3">
          <WaterAlert deficit={deficit} onAdd={() => openTracker('water')} />
        </div>
      )}

      <BACGauge range={range} risk={risk} />

      <div className="grid grid-cols-2 gap-2 mt-3">
        {planToDrive ? (
          <StatChip
            label="Drinks left"
            value={legalDrinksLeft.toString()}
            sub="under 0.05 BAC"
          />
        ) : (
          <StatChip
            label="Peak tonight"
            value={`${sessionPeak.toFixed(3)}%`}
            sub="projected max BAC"
          />
        )}
        <StatChip
          label="Sober by"
          value={sober ? formatClockWithDay(sober, now) : '—'}
          sub="estimated"
        />
      </div>

      {planToDrive ? (
        <>
          {risk === 'red' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 rounded-2xl p-3 bg-rose-50 border border-rose-200 text-sm text-risk-red font-medium"
            >
              Estimated BAC exceeds the legal driving limit (0.05). Do not drive.
              Consider stopping.
            </motion.div>
          )}
          {risk === 'yellow' && (
            <div className="mt-3 rounded-2xl p-3 bg-amber-50 border border-amber-200 text-sm text-amber-900 font-medium">
              Approaching the driving limit. Plan a ride home.
            </div>
          )}
        </>
      ) : (
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

      {cutoff.kind !== 'no-drinks' && (
        <div className="mt-3">
          <CutoffBanner result={cutoff} now={now} />
        </div>
      )}

      <div className="mt-4">
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
        className="w-full mt-5 h-11 text-sm font-semibold text-ink-muted hover:text-ink transition"
      >
        End session
      </button>
      <p className="text-[11px] text-ink-dim text-center mt-1">
        Estimates only — never drive after drinking.
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
        'h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-bold tracking-tight border transition min-tap',
        value
          ? 'bg-risk-red text-white border-risk-red shadow-press'
          : 'bg-bg-elev text-ink-muted border-line hover:bg-bg-card',
      )}
    >
      {value ? <Car className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {value ? 'Driving' : 'Not driving'}
    </button>
  );
}

function StatChip({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-3 bg-bg-card border border-line shadow-card">
      <div className="text-[11px] font-semibold text-ink-muted">{label}</div>
      <div className="text-lg font-bold text-ink mt-1 tabular-nums leading-tight tracking-tight">
        {value}
      </div>
      <div className="text-[11px] text-ink-dim">{sub}</div>
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

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 mb-6"
      >
        <h1 className="text-4xl font-bold text-ink tracking-tight">
          Hey, <span className="sunset-text">{profileName}</span>
        </h1>
        <p className="text-ink-muted text-[15px] mt-2">
          How long do you plan to drink tonight? You can adjust later.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="text-center">
          <div className="text-xs font-semibold text-ink-muted">Expected duration</div>
          <div className="text-[88px] font-bold text-ink my-3 tabular-nums leading-none tracking-tight">
            <span className="sunset-text">{hours}</span>
            <span className="text-3xl text-ink-muted ml-1 font-semibold">h</span>
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
          <div className="flex justify-between text-xs text-ink-dim mt-2 px-1">
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
                className="text-xs text-accent font-semibold underline-offset-2 hover:underline"
              >
                {useWake ? "I'll sleep in" : 'Set a time'}
              </button>
            </div>
            {useWake ? (
              <input
                type="datetime-local"
                value={wakeDraft}
                onChange={(e) => setWakeDraft(e.target.value)}
                className="w-full h-11 px-3 mt-2 rounded-xl bg-bg-elev border border-line text-ink focus:border-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
            ) : (
              <div className="mt-2 text-ink-dim text-sm">
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
                  !driving ? 'bg-ink text-white' : 'bg-bg-elev border border-line text-ink-muted'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setDriving(true)}
                className={`h-11 rounded-xl text-sm font-semibold min-tap transition-all ${
                  driving ? 'bg-risk-red text-white' : 'bg-bg-elev border border-line text-ink-muted'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            onClick={() =>
              onStart(hours, {
                wakeAtMs: useWake ? wakeMs : undefined,
                planToDrive: driving,
              })
            }
          >
            Start session
          </Button>
        </Card>
      </motion.div>

      <p className="text-xs text-ink-dim text-center mt-4">
        Estimates only — never drive after drinking.
      </p>
    </div>
  );
}
