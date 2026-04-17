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

  return (
    <ActiveSession
      profileName={profile.name}
      onEnd={() => {
        const peak = peakBacInWindow(
          profile,
          active.drinks,
          active.food,
          active.startedAt,
          Date.now()
        );
        endSession(peak);
      }}
      sessionEndsAt={active.startedAt + active.expectedHours * 60 * 60 * 1000}
      now={now}
    >
      {(() => {
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
          <>
            <BACGauge range={range} risk={risk} />

            <div className="grid grid-cols-2 gap-2">
              <Card className="text-center py-3">
                <div className="text-xs uppercase tracking-wider text-ink-muted">
                  Drinks left
                </div>
                <div className="text-2xl font-semibold text-ink mt-1 tabular-nums">
                  {remaining}
                </div>
                <div className="text-[10px] text-ink-dim">at this pace</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xs uppercase tracking-wider text-ink-muted">
                  Sober at
                </div>
                <div className="text-2xl font-semibold text-ink mt-1 tabular-nums">
                  {sober ? formatClock(sober) : '—'}
                </div>
                <div className="text-[10px] text-ink-dim">estimated</div>
              </Card>
            </div>

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
              <div className="rounded-2xl p-3 bg-risk-red/15 border border-risk-red/30 text-sm text-risk-red">
                Your estimated BAC exceeds the legal driving limit in most regions
                (0.05). Do not drive. Consider stopping.
              </div>
            )}
          </>
        );
      })()}
    </ActiveSession>
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
    <div className="max-w-md mx-auto p-4 pb-24">
      <header className="my-6">
        <h1 className="text-2xl font-bold text-ink">Hi, {profileName}</h1>
        <p className="text-ink-muted text-sm mt-1">
          Set how long you're planning to drink. You can change it later.
        </p>
      </header>
      <Card>
        <div className="text-xs uppercase tracking-wider text-ink-muted">
          Expected duration
        </div>
        <div className="text-5xl font-semibold text-ink text-center my-4 tabular-nums">
          {hours}h
        </div>
        <input
          type="range"
          min="1"
          max="12"
          step="0.5"
          value={hours}
          onChange={(e) => setHours(parseFloat(e.target.value))}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-ink-dim mt-1">
          <span>1h</span>
          <span>12h</span>
        </div>
        <Button className="w-full mt-6" size="lg" onClick={() => onStart(hours)}>
          Start session
        </Button>
      </Card>
      <p className="text-[11px] text-ink-dim text-center mt-4">
        Estimates only — never drive after drinking.
      </p>
    </div>
  );
}

function ActiveSession({
  profileName,
  onEnd,
  children,
}: {
  profileName: string;
  onEnd: () => void;
  sessionEndsAt: number;
  now: number;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <header className="my-4 flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-ink">Hi, {profileName}</h1>
        <span className="text-xs text-ink-muted">Estimates only</span>
      </header>
      <div className="space-y-3">{children}</div>
      <div className="mt-6">
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          onClick={() => {
            if (confirm('End session and save to history?')) onEnd();
          }}
        >
          End session
        </Button>
      </div>
      <p className="text-[11px] text-ink-dim text-center mt-3">
        Estimates only — never drive after drinking.
      </p>
    </div>
  );
}
