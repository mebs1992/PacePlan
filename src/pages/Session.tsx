import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { WaterAlert } from '@/components/WaterAlert';
import { CutoffBanner } from '@/components/CutoffBanner';
import { HangoverCard } from '@/components/HangoverCard';
import { SessionMeta } from '@/components/SessionMeta';
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
  projectedSoberAt,
  recommendCutoff,
  riskFor,
  suggestedDrinksRemaining,
  waterBehind,
  waterDeficit,
} from '@/lib/bac';
import { formatClockWithDay } from '@/lib/time';
import type { DrinkEntry, FoodEntry, RiskLevel, WaterEntry } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Moon } from 'lucide-react';

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

  const sessionEndsAt = active
    ? active.startedAt + active.expectedHours * 60 * 60 * 1000
    : 0;
  const wakeAtMs = active?.wakeAtMs;

  const curve = useMemo(
    () =>
      active
        ? bacCurve(
            profile,
            active.drinks,
            active.food,
            active.startedAt,
            Math.max(sessionEndsAt, (wakeAtMs ?? 0) + 60_000, now + 60_000),
            100,
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, active?.drinks, active?.food, active?.startedAt, sessionEndsAt, wakeAtMs],
  );

  if (!active) {
    return <StartSession profileName={profile.name} onStart={startSession} />;
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
  const sober = projectedSoberAt(inputs, planToDrive ? 0.05 : 0);
  const cutoff = recommendCutoff(inputs, sessionEndsAt);
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
    active.startedAt,
    Math.max(sessionEndsAt, wakeAtMs ?? sessionEndsAt),
  );
  const hRisk = hangoverRiskFor(sessionPeak, bacAtWake, deficit);
  const hangoverDrinksLeft = wakeAtMs
    ? drinksUntilHangover(inputs, sessionEndsAt, wakeAtMs)
    : null;
  const legalDrinksLeft = suggestedDrinksRemaining(inputs, sessionEndsAt, 1.4, 0.045);

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
        <TinyMenu planToDrive={planToDrive} onTogglePlan={() => setPlanToDrive(!planToDrive)} />
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
          title={planToDrive ? 'ABLE TO DRIVE' : 'SOBER BY'}
          big={sober ? formatClockWithDay(sober, now) : (planToDrive ? 'clear' : '—')}
          sub={planToDrive ? 'est. ability to drive' : 'est. clearance'}
          flavor={planToDrive ? 'BAC < 0.05%' : '0.00% BAC'}
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

      <QuickAddRow onOpen={openTracker} />

      <LogList
        profile={profile}
        drinks={active.drinks}
        water={active.water}
        food={active.food}
        onRemoveDrink={removeDrink}
        onRemoveWater={removeWater}
        onRemoveFood={removeFood}
      />

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

function TinyMenu({
  planToDrive,
  onTogglePlan,
}: {
  planToDrive: boolean;
  onTogglePlan: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="menu"
        aria-expanded={open}
        className="relative h-[42px] w-[42px] rounded-[14px] border border-line bg-bg-card flex items-center justify-center text-ink hover:bg-bg-elev transition"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </svg>
        {planToDrive && (
          <span
            className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-risk-red"
            style={{ border: '2px solid #F4EFE4' }}
          />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 cursor-default"
              tabIndex={-1}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-[calc(100%+8px)] z-40 min-w-[200px] rounded-2xl border border-line bg-bg-card shadow-card-lg p-1.5"
            >
              <button
                type="button"
                onClick={() => {
                  onTogglePlan();
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-bg-elev transition"
              >
                <span className="flex items-center gap-2 text-sm text-ink">
                  {planToDrive ? (
                    <Car className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  Plan to drive
                </span>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider ${
                    planToDrive ? 'text-risk-red' : 'text-ink-dim'
                  }`}
                >
                  {planToDrive ? 'ON' : 'OFF'}
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAddRow({ onOpen }: { onOpen: (tab: TrackerTab) => void }) {
  const items: { tab: TrackerTab; label: string }[] = [
    { tab: 'drink', label: '+ Drink' },
    { tab: 'water', label: '+ Water' },
    { tab: 'food', label: '+ Food' },
  ];
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {items.map((it) => (
        <button
          key={it.tab}
          type="button"
          onClick={() => onOpen(it.tab)}
          className="h-11 rounded-full border border-line-2 bg-bg-card text-ink font-display text-[15px] italic hover:bg-bg-elev active:scale-[0.98] transition min-tap"
        >
          {it.label}
        </button>
      ))}
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
