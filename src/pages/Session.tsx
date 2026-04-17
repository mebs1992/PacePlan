import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BACGauge } from '@/components/BACGauge';
import { DrinkPicker } from '@/components/DrinkPicker';
import { WaterTracker } from '@/components/WaterTracker';
import { FoodLog } from '@/components/FoodLog';
import { SessionTimer } from '@/components/SessionTimer';
import { CutoffBanner } from '@/components/CutoffBanner';
import { DrinkList } from '@/components/DrinkList';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import {
  computeBacRange,
  peakBacInWindow,
  recommendCutoff,
  riskFor,
  soberAtMs,
  suggestedDrinksRemaining,
  waterBehind,
} from '@/lib/bac';
import { formatClock } from '@/lib/time';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

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
  const remaining = suggestedDrinksRemaining(inputs, sessionEndsAt);
  const behind = waterBehind(active.drinks, active.water.length);

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <header className="mt-4 mb-2 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-ink">Hi, {profile.name}</h1>
        <span className="text-[10px] text-ink-dim uppercase tracking-widest">
          Estimates only
        </span>
      </header>

      <BACGauge range={range} risk={risk} />

      <div className="grid grid-cols-2 gap-2 mt-4">
        <StatChip
          label="Drinks left"
          value={remaining.toString()}
          sub="at this pace"
          accent="from-accent/20 to-accent/5"
        />
        <StatChip
          label="Sober at"
          value={sober ? formatClock(sober) : '—'}
          sub="estimated"
          accent="from-accent-violet/20 to-accent-violet/5"
        />
      </div>

      <div className="space-y-3 mt-4">
        <CutoffBanner result={cutoff} />
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

        {risk === 'red' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-3 bg-gradient-to-br from-risk-red/15 to-[#a78bfa]/5 border border-risk-red/30 text-sm text-risk-red"
          >
            Estimated BAC exceeds the legal driving limit in most regions (0.05). Do not
            drive. Consider stopping.
          </motion.div>
        )}

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
      <div className="text-2xl font-bold text-ink mt-1 tabular-nums">{value}</div>
      <div className="text-[10px] text-ink-dim">{sub}</div>
    </div>
  );
}

function StartSession({
  profileName,
  onStart,
}: {
  profileName: string;
  onStart: (h: number) => void;
}) {
  const [hours, setHours] = useState(4);
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
          <Button className="w-full mt-6" size="lg" onClick={() => onStart(hours)}>
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
