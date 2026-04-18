import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACGauge } from '@/components/BACGauge';
import { DrinkPicker } from '@/components/DrinkPicker';
import { WaterTracker } from '@/components/WaterTracker';
import { WaterAlert } from '@/components/WaterAlert';
import { FoodLog } from '@/components/FoodLog';
import { SessionTimer } from '@/components/SessionTimer';
import { CutoffBanner } from '@/components/CutoffBanner';
import { DrinkList } from '@/components/DrinkList';
import { WakeTimePicker } from '@/components/WakeTimePicker';
import { HangoverCard } from '@/components/HangoverCard';
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
import { Car, Moon, Sparkles } from 'lucide-react';

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
  const addWater = useSession((s) => s.addWater);
  const setExpectedHours = useSession((s) => s.setExpectedHours);
  const setWakeAt = useSession((s) => s.setWakeAt);
  const setPlanToDrive = useSession((s) => s.setPlanToDrive);

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
        BETA_TYPICAL
      )
    : 0;
  const sessionPeak = peakBacInWindow(
    profile,
    active.drinks,
    active.food,
    active.startedAt,
    Math.max(sessionEndsAt, wakeAtMs ?? sessionEndsAt)
  );
  const hRisk = hangoverRiskFor(sessionPeak, bacAtWake, deficit);
  const hangoverDrinksLeft = wakeAtMs
    ? drinksUntilHangover(inputs, sessionEndsAt, wakeAtMs)
    : null;
  const legalDrinksLeft = suggestedDrinksRemaining(inputs, sessionEndsAt, 1.4, 0.045);

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <header className="mt-4 mb-2 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-ink">Hi, {profile.name}</h1>
        <span className="text-[10px] text-ink-dim uppercase tracking-widest">
          Estimates only
        </span>
      </header>

      {behind && <WaterAlert deficit={deficit} onAdd={addWater} />}

      <div className="mt-3">
        <DrivingToggle value={planToDrive} onChange={setPlanToDrive} />
      </div>

      {planToDrive ? (
        <>
          <BACGauge range={range} risk={risk} />
          {risk === 'red' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 rounded-2xl p-3 bg-gradient-to-br from-risk-red/25 to-[#a78bfa]/10 border border-risk-red/40 text-sm text-risk-red shadow-[0_0_30px_-8px_rgba(244,63,94,0.6)]"
            >
              Estimated BAC exceeds the legal driving limit in most regions (0.05). Do
              not drive. Consider stopping.
            </motion.div>
          )}
          {risk === 'yellow' && (
            <div className="mt-3 rounded-2xl p-3 bg-gradient-to-br from-risk-yellow/15 to-amber-500/5 border border-risk-yellow/30 text-sm text-risk-yellow">
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

      <div className="grid grid-cols-2 gap-2 mt-4">
        {planToDrive ? (
          <StatChip
            label="Drinks left"
            value={legalDrinksLeft.toString()}
            sub="under 0.05 BAC"
            accent="from-accent/20 to-accent/5"
          />
        ) : (
          <StatChip
            label="Peak tonight"
            value={`${sessionPeak.toFixed(3)}%`}
            sub="projected max BAC"
            accent="from-accent/20 to-accent/5"
          />
        )}
        <StatChip
          label="Sober by"
          value={sober ? formatClockWithDay(sober, now) : '—'}
          sub="estimated"
          accent="from-accent-violet/20 to-accent-violet/5"
        />
      </div>

      {!planToDrive && (
        <div className="mt-3">
          <BACGauge range={range} risk={risk} />
        </div>
      )}

      <div className="space-y-3 mt-4">
        <CutoffBanner result={cutoff} now={now} />
        <WakeTimePicker wakeAtMs={wakeAtMs} now={now} onChange={setWakeAt} />
        <SessionTimer
          startedAt={active.startedAt}
          expectedHours={active.expectedHours}
          now={now}
          onChangeHours={setExpectedHours}
        />
        <DrinkPicker onAdd={addDrink} />
        <WaterTracker
          glasses={active.water.length}
          drinks={active.drinks.length}
          behind={behind}
          onAdd={addWater}
        />
        <FoodLog entries={active.food} now={now} onAdd={addFood} />
        <DrinkList drinks={active.drinks} now={now} onRemove={removeDrink} />

        <Button
          variant="danger"
          size="lg"
          className="w-full mt-4"
          onClick={() => {
            if (confirm('End session and save to history?')) {
              const peak = peakBacInWindow(
                profile,
                active.drinks,
                active.food,
                active.startedAt,
                Date.now()
              );
              endSession(peak);
            }
          }}
        >
          End session
        </Button>
        <p className="text-[11px] text-ink-dim text-center">
          Estimates only — never drive after drinking.
        </p>
      </div>
    </div>
  );
}

function DrivingToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="relative glass rounded-2xl p-1 flex">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 min-tap h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
          !value
            ? 'bg-gradient-to-br from-accent/25 to-accent-violet/25 border border-accent/30 text-ink shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]'
            : 'text-ink-muted'
        }`}
      >
        <Moon className="h-4 w-4" /> Not driving
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 min-tap h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
          value
            ? 'bg-gradient-to-br from-risk-red/25 to-[#a78bfa]/25 border border-risk-red/40 text-ink shadow-[0_0_20px_-6px_rgba(244,63,94,0.5)]'
            : 'text-ink-muted'
        }`}
      >
        <Car className="h-4 w-4" /> I plan on driving
      </button>
    </div>
  );
}

function StatChip({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3 glass bg-gradient-to-br ${accent}`}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{label}</div>
      <div className="text-lg font-bold text-ink mt-1 tabular-nums leading-tight">
        {value}
      </div>
      <div className="text-[10px] text-ink-dim">{sub}</div>
    </div>
  );
}

function StartSession({
  profileName,
  onStart,
}: {
  profileName: string;
  onStart: (
    h: number,
    opts?: { wakeAtMs?: number; planToDrive?: boolean }
  ) => void;
}) {
  const [hours, setHours] = useState(4);
  const [wakeDraft, setWakeDraft] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
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
        className="mt-8 mb-6"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-ink-muted mb-3">
          <Sparkles className="h-3 w-3 text-accent" />
          ready when you are
        </div>
        <h1 className="text-3xl font-bold text-ink">
          Hey, <span className="gradient-text">{profileName}</span>
        </h1>
        <p className="text-ink-muted text-sm mt-2">
          How long do you plan to drink tonight? You can adjust later.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="text-center">
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Expected duration
          </div>
          <div className="font-display text-7xl font-semibold text-ink my-4 tabular-nums gradient-text leading-none">
            {hours}
            <span className="text-3xl text-ink-muted ml-1">h</span>
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
          <div className="flex justify-between text-[10px] text-ink-dim mt-2 px-1">
            <span>1h</span>
            <span>6h</span>
            <span>12h</span>
          </div>

          <div className="mt-6 text-left">
            <div className="flex items-center justify-between">
              <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Wake up time
              </label>
              <button
                type="button"
                onClick={() => setUseWake((v) => !v)}
                className="text-[11px] text-ink-muted underline underline-offset-2"
              >
                {useWake ? 'I’ll sleep in' : 'Set a time'}
              </button>
            </div>
            {useWake ? (
              <input
                type="datetime-local"
                value={wakeDraft}
                onChange={(e) => setWakeDraft(e.target.value)}
                className="w-full h-11 px-3 mt-2 rounded-xl bg-white/10 border border-white/10 text-ink"
              />
            ) : (
              <div className="mt-2 text-ink-dim text-sm">
                Whenever — we’ll only track sober time.
              </div>
            )}
          </div>

          <div className="mt-5 text-left">
            <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Do you plan on driving?
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDriving(false)}
                className={`h-11 rounded-xl text-sm font-medium min-tap transition-all ${
                  !driving
                    ? 'bg-gradient-to-br from-accent/25 to-accent-violet/25 border border-accent/30 text-ink'
                    : 'bg-white/5 border border-white/10 text-ink-muted'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => setDriving(true)}
                className={`h-11 rounded-xl text-sm font-medium min-tap transition-all ${
                  driving
                    ? 'bg-gradient-to-br from-risk-red/25 to-[#a78bfa]/25 border border-risk-red/40 text-ink'
                    : 'bg-white/5 border border-white/10 text-ink-muted'
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
            Start session →
          </Button>
        </Card>
      </motion.div>

      <p className="text-[11px] text-ink-dim text-center mt-4">
        Estimates only — never drive after drinking.
      </p>
    </div>
  );
}
