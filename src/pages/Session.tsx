import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACGauge } from '@/components/BACGauge';
import { WaterAlert } from '@/components/WaterAlert';
import { SessionTimer } from '@/components/SessionTimer';
import { CutoffBanner } from '@/components/CutoffBanner';
import { WakeTimePicker } from '@/components/WakeTimePicker';
import { HangoverCard } from '@/components/HangoverCard';
import { ActionTile } from '@/components/ActionTile';
import { DrinkSheet } from '@/components/sheets/DrinkSheet';
import { WaterSheet } from '@/components/sheets/WaterSheet';
import { FoodSheet } from '@/components/sheets/FoodSheet';
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
import { formatClockWithDay, formatRelative } from '@/lib/time';
import { motion } from 'framer-motion';
import { Beer, Car, Cookie, Droplet, Moon, UtensilsCrossed } from 'lucide-react';

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

  const [sheet, setSheet] = useState<'drink' | 'water' | 'food' | null>(null);

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

  const drinkTotal = active.drinks.reduce((s, d) => s + d.standardDrinks, 0);
  const drinkCaption =
    active.drinks.length === 0
      ? 'Tap to log your first'
      : `${drinkTotal.toFixed(1)} std · last ${formatRelative(
          active.drinks[active.drinks.length - 1].at,
          now
        )}`;

  const waterTarget = Math.max(active.drinks.length, 1);
  const waterCaption = behind
    ? `${deficit} ${deficit === 1 ? 'glass' : 'glasses'} behind — drink up`
    : active.drinks.length === 0
      ? 'Log a glass anytime'
      : `${active.water.length}/${waterTarget} — good pace`;

  const lastFood = active.food[active.food.length - 1];
  const foodCaption = lastFood
    ? `Last ${lastFood.size} · ${formatRelative(lastFood.at, now)}`
    : 'No food logged yet';

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <header className="mt-6 mb-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Hi, {profile.name}</h1>
        <span className="text-[11px] text-ink-dim font-medium">Estimates only</span>
      </header>

      {behind && (
        <div className="mb-3">
          <WaterAlert deficit={deficit} onAdd={() => setSheet('water')} />
        </div>
      )}

      <DrivingToggle value={planToDrive} onChange={setPlanToDrive} />

      <div className="mt-3">
        <BACGauge range={range} risk={risk} />
      </div>

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

      <div className="mt-5 mb-2 flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Track
        </h2>
      </div>
      <div className="space-y-2">
        <ActionTile
          tone="coral"
          icon={Beer}
          label="Drink"
          count={active.drinks.length}
          caption={drinkCaption}
          onClick={() => setSheet('drink')}
        />
        <ActionTile
          tone="sky"
          icon={Droplet}
          label="Water"
          count={active.water.length}
          caption={waterCaption}
          alert={behind}
          onClick={() => setSheet('water')}
        />
        <ActionTile
          tone="amber"
          icon={lastFood?.size === 'meal' ? UtensilsCrossed : Cookie}
          label="Food"
          count={active.food.length}
          caption={foodCaption}
          onClick={() => setSheet('food')}
        />
      </div>

      <div className="mt-5 mb-2 flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Session
        </h2>
      </div>
      <div className="space-y-3">
        <WakeTimePicker wakeAtMs={wakeAtMs} now={now} onChange={setWakeAt} />
        <SessionTimer
          startedAt={active.startedAt}
          expectedHours={active.expectedHours}
          now={now}
          onChangeHours={setExpectedHours}
        />
      </div>

      <Button
        variant="secondary"
        size="lg"
        className="w-full mt-6"
        onClick={() => {
          if (confirm('End session and save to history?')) {
            const peak = peakBacInWindow(
              profile,
              active.drinks,
              active.food,
              active.startedAt,
              Date.now()
            );
            endSession(peak, hRisk);
          }
        }}
      >
        End session
      </Button>
      <p className="text-xs text-ink-dim text-center mt-3">
        Estimates only — never drive after drinking.
      </p>

      <DrinkSheet
        open={sheet === 'drink'}
        onClose={() => setSheet(null)}
        drinks={active.drinks}
        now={now}
        onAdd={addDrink}
        onRemove={removeDrink}
      />
      <WaterSheet
        open={sheet === 'water'}
        onClose={() => setSheet(null)}
        glasses={active.water.length}
        drinks={active.drinks.length}
        behind={behind}
        water={active.water}
        now={now}
        onAdd={addWater}
        onRemove={removeWater}
      />
      <FoodSheet
        open={sheet === 'food'}
        onClose={() => setSheet(null)}
        entries={active.food}
        now={now}
        onAdd={addFood}
        onRemove={removeFood}
      />
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
    <div className="relative bg-bg-elev rounded-2xl p-1 flex border border-line">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 min-tap h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
          !value ? 'bg-bg-card text-ink shadow-press' : 'text-ink-muted'
        }`}
      >
        <Moon className="h-4 w-4" /> Not driving
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 min-tap h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
          value ? 'bg-risk-red text-white shadow-press' : 'text-ink-muted'
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
