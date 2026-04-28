import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Apple,
  Car,
  Check,
  Cookie,
  Droplets,
  Pencil,
  Smartphone,
  Target,
  Users,
  Utensils,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatClockWithDay } from '@/lib/time';
import {
  countdownHeadline,
  getActiveTips,
  type StatusedTip,
  type TipIcon,
  type TipStatus,
} from '@/lib/prepTips';
import type { Session } from '@/types';

type Props = {
  active: Session;
  now: number;
  firstName: string;
  onTogglePrepDone: (id: string) => void;
  onSetPlannedStart: (ms: number | undefined) => void;
  onStartNow: () => void;
  onCancel: () => void;
  onLogFood: () => void;
  onLogWater: () => void;
};

const ICON_MAP: Record<TipIcon, React.ComponentType<{ className?: string }>> = {
  meal: Utensils,
  snack: Cookie,
  water: Droplets,
  ride: Car,
  phone: Smartphone,
  friend: Users,
  cap: Target,
  electrolyte: Apple,
  pace: Zap,
};

const STATUS_COPY: Record<TipStatus, { chip: string; color: string; bg: string }> = {
  active: { chip: '', color: '#9FB0C3', bg: 'transparent' },
  urgent: { chip: 'SOON', color: '#F1E9DA', bg: 'rgba(241,233,218,0.10)' },
  overdue: { chip: 'NOW', color: '#E8CFC5', bg: 'rgba(232,207,197,0.10)' },
  done: { chip: 'DONE', color: '#38BDF8', bg: 'transparent' },
};

function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function countdownParts(ms: number): { h: number; m: number } {
  const total = Math.max(0, Math.round(ms / 60_000));
  return { h: Math.floor(total / 60), m: total % 60 };
}

export function PreSession({
  active,
  now,
  firstName,
  onTogglePrepDone,
  onSetPlannedStart,
  onStartNow,
  onCancel,
  onLogFood,
  onLogWater,
}: Props) {
  const plannedStart = active.plannedStartMs!;
  const msUntil = Math.max(0, plannedStart - now);
  const { h, m } = countdownParts(msUntil);
  const minutesUntilStart = Math.max(0, Math.floor(msUntil / 60_000));
  const mealLogged = active.food.some((f) => f.size === 'meal');
  const waterLoggedCount = active.water.length;

  const tips = useMemo(
    () =>
      getActiveTips({
        minutesUntilStart,
        mealLogged,
        waterLoggedCount,
        completedIds: active.prepDone ?? [],
      }),
    [minutesUntilStart, mealLogged, waterLoggedCount, active.prepDone],
  );

  const headline = countdownHeadline(minutesUntilStart);
  const dateLabel = new Date(plannedStart)
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const overdueCount = tips.filter((t) => t.status === 'overdue').length;
  const urgentCount = tips.filter((t) => t.status === 'urgent').length;
  const doneCount = tips.filter((t) => t.status === 'done').length;
  const openCount = tips.length - doneCount;

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-32">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="eyebrow">PRE-GAME · {dateLabel}</div>
        <h1 className="font-display text-[40px] leading-[1.02] tracking-[-0.03em] text-ink mt-1">
          Hi, <span className="italic text-accent">{firstName}.</span>
        </h1>
        <p className="font-display italic text-ink-muted text-[17px] mt-2">
          {headline}
        </p>
      </motion.header>

      <Countdown
        h={h}
        m={m}
        plannedStart={plannedStart}
        now={now}
        onEdit={(ms) => onSetPlannedStart(ms)}
      />

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="open" value={openCount.toString()} />
        <MiniStat
          label="soon"
          value={urgentCount.toString()}
          accent={urgentCount > 0 ? '#F1E9DA' : undefined}
        />
        <MiniStat
          label="now"
          value={overdueCount.toString()}
          accent={overdueCount > 0 ? '#E8CFC5' : undefined}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <div className="eyebrow">GAME PLAN</div>
          <div className="font-mono text-[10px] text-ink-dim">
            updates as you go
          </div>
        </div>

        <ul className="mt-3 space-y-2.5">
          <AnimatePresence initial={false}>
            {tips.map((tip) => (
              <TipRow
                key={tip.id}
                tip={tip}
                onToggle={() => onTogglePrepDone(tip.id)}
                onLogFood={onLogFood}
                onLogWater={onLogWater}
              />
            ))}
          </AnimatePresence>
          {tips.length === 0 && (
            <li className="rounded-[18px] border border-dashed border-line p-5 text-center">
              <div className="font-display italic text-ink-muted text-[16px]">
                Nothing to do yet.
              </div>
              <div className="font-mono text-[11px] text-ink-dim mt-1">
                Tips will appear as your start time approaches.
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-8 space-y-2">
        <Button
          variant="primary"
          className="w-full font-display italic text-[18px]"
          size="lg"
          onClick={onStartNow}
        >
          Start drinking now
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3 font-mono text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink transition"
        >
          Cancel session
        </button>
      </div>

      <p className="font-mono text-[10px] text-ink-dim text-center mt-4 uppercase tracking-wider">
        BAC tracking starts at {formatClockWithDay(plannedStart, now)}.
      </p>
    </div>
  );
}

function Countdown({
  h,
  m,
  plannedStart,
  now,
  onEdit,
}: {
  h: number;
  m: number;
  plannedStart: number;
  now: number;
  onEdit: (ms: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => toLocalInputValue(plannedStart));

  return (
    <div className="rounded-[24px] border border-line bg-bg-card shadow-card px-5 py-6">
      <div className="eyebrow">STARTS IN</div>
      <div
        className="font-display tabular-nums text-ink mt-1 leading-none tracking-[-0.03em]"
        style={{ fontSize: 72, fontWeight: 300 }}
      >
        {h > 0 && <>{h}<span className="text-[32px] text-ink-muted">h</span> </>}
        {m}
        <span className="text-[32px] text-ink-muted">m</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="font-mono text-[11px] text-ink-dim">
          at {formatClockWithDay(plannedStart, now)}
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(toLocalInputValue(plannedStart));
            setEditing((v) => !v);
          }}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent hover:underline"
        >
          <Pencil className="h-3 w-3" /> change
        </button>
      </div>
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pt-3 flex gap-2">
              <input
                type="datetime-local"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 h-11 px-3 rounded-xl bg-bg-elev border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
              <Button
                size="sm"
                onClick={() => {
                  const n = new Date(draft).getTime();
                  if (Number.isFinite(n)) {
                    onEdit(n);
                    setEditing(false);
                  }
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-bg-card px-3 py-2.5">
      <div
        className="font-display tabular-nums text-[22px] leading-none"
        style={{ color: accent ?? '#E6EDF5' }}
      >
        {value}
      </div>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase mt-1"
        style={{ color: accent ?? '#6B7C93' }}
      >
        {label}
      </div>
    </div>
  );
}

function TipRow({
  tip,
  onToggle,
  onLogFood,
  onLogWater,
}: {
  tip: StatusedTip;
  onToggle: () => void;
  onLogFood: () => void;
  onLogWater: () => void;
}) {
  const Icon = ICON_MAP[tip.icon];
  const style = STATUS_COPY[tip.status];
  const isDone = tip.status === 'done';

  const quickAction =
    tip.id === 'meal' || tip.id === 'snack-now'
      ? { label: 'Log food', onClick: onLogFood }
      : tip.id === 'hydrate'
        ? { label: 'Log water', onClick: onLogWater }
        : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-[18px] border border-line overflow-hidden"
      style={{ background: style.bg === 'transparent' ? '#1E293B' : style.bg }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isDone ? 'Mark undone' : 'Mark done'}
          className={`h-9 w-9 shrink-0 rounded-full border flex items-center justify-center transition ${
            isDone
              ? 'border-risk-green bg-risk-green text-bg'
              : 'border-line bg-bg-elev text-ink-muted hover:border-ink-muted'
          }`}
          style={{
            borderColor: isDone ? '#38BDF8' : undefined,
            background: isDone ? '#38BDF8' : undefined,
          }}
        >
          {isDone ? (
            <Check className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <div
              className={`font-display text-[15px] leading-tight ${
                isDone ? 'line-through text-ink-muted' : 'text-ink'
              }`}
            >
              {tip.title}
            </div>
            {style.chip && (
              <span
                className="font-mono text-[9px] tracking-[0.14em] px-1.5 py-0.5 rounded"
                style={{
                  color: style.color,
                  background: 'rgba(255,255,255,0.6)',
                  border: `1px solid ${style.color}40`,
                }}
              >
                {style.chip}
              </span>
            )}
          </div>
          <div
            className={`font-mono text-[11px] mt-1 leading-snug tracking-tight ${
              isDone ? 'text-ink-dim' : ''
            }`}
            style={{ color: isDone ? undefined : style.color }}
          >
            {tip.displayDetail}
          </div>
          {!isDone && quickAction && (
            <button
              type="button"
              onClick={quickAction.onClick}
              className="mt-2 font-mono text-[10px] uppercase tracking-wider text-accent hover:underline"
            >
              {quickAction.label} →
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
