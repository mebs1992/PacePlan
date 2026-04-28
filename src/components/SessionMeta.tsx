import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlarmClock, Clock, Pencil, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatClockWithDay, formatDuration } from '@/lib/time';
import { cn } from '@/lib/utils';

type Props = {
  startedAt: number;
  expectedHours: number;
  wakeAtMs: number | undefined;
  now: number;
  onChangeHours: (h: number) => void;
  onChangeWake: (ms: number | undefined) => void;
};

type Editing = null | 'wake' | 'session';

function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function defaultWake(now: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.getTime();
}

export function SessionMeta({
  startedAt,
  expectedHours,
  wakeAtMs,
  now,
  onChangeHours,
  onChangeWake,
}: Props) {
  const [editing, setEditing] = useState<Editing>(null);
  const elapsed = Math.max(0, now - startedAt);
  const expectedMs = expectedHours * 60 * 60 * 1000;
  const remaining = expectedMs - elapsed;
  const overtime = remaining < 0;
  const pct = Math.min(100, (elapsed / Math.max(expectedMs, 1)) * 100);

  return (
    <div className="rounded-2xl bg-bg-card border border-line shadow-card overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-line">
        <MetaButton
          icon={wakeAtMs ? AlarmClock : Sunrise}
          label="Wake"
          value={wakeAtMs ? formatClockWithDay(wakeAtMs, now) : 'Not set'}
          dim={!wakeAtMs}
          active={editing === 'wake'}
          onClick={() => setEditing(editing === 'wake' ? null : 'wake')}
        />
        <MetaButton
          icon={Clock}
          label={overtime ? 'Overtime' : 'Time left'}
          value={`${formatDuration(Math.abs(remaining))} / ${expectedHours}h`}
          accent={overtime}
          active={editing === 'session'}
          onClick={() => setEditing(editing === 'session' ? null : 'session')}
        />
      </div>
      <div className="h-[3px] bg-bg-elev">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent-violet"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>

      <AnimatePresence initial={false}>
        {editing === 'wake' && (
          <EditPanel key="wake">
            <WakeEditor
              wakeAtMs={wakeAtMs}
              now={now}
              onSave={(ms) => {
                onChangeWake(ms);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </EditPanel>
        )}
        {editing === 'session' && (
          <EditPanel key="session">
            <HoursEditor
              expectedHours={expectedHours}
              onSave={(h) => {
                onChangeHours(h);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          </EditPanel>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaButton({
  icon: Icon,
  label,
  value,
  dim,
  accent,
  active,
  onClick,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  dim?: boolean;
  accent?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-2 px-3.5 py-3 text-left transition min-tap',
        active ? 'bg-bg-elev' : 'hover:bg-bg-elev',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
          <Icon className="h-3 w-3" />
          {label}
        </div>
        <div
          className={cn(
            'text-sm font-bold tabular-nums tracking-tight mt-1 truncate',
            accent ? 'text-risk-yellow' : dim ? 'text-ink-muted' : 'text-ink',
          )}
        >
          {value}
        </div>
      </div>
      <Pencil className="h-3.5 w-3.5 text-ink-dim shrink-0" />
    </button>
  );
}

function EditPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      className="overflow-hidden border-t border-line bg-bg-elev"
    >
      <div className="p-3.5">{children}</div>
    </motion.div>
  );
}

function WakeEditor({
  wakeAtMs,
  now,
  onSave,
  onCancel,
}: {
  wakeAtMs: number | undefined;
  now: number;
  onSave: (ms: number | undefined) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() =>
    toLocalInputValue(wakeAtMs ?? defaultWake(now)),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const ms = useMemo(() => {
    const n = new Date(draft).getTime();
    return Number.isFinite(n) ? n : null;
  }, [draft]);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="datetime-local"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full h-11 px-3 rounded-xl bg-bg-elev border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => ms && onSave(ms)}
          disabled={!ms}
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onSave(undefined)}
        >
          Clear
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function HoursEditor({
  expectedHours,
  onSave,
  onCancel,
}: {
  expectedHours: number;
  onSave: (h: number) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(String(expectedHours));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        min="0.5"
        max="24"
        step="0.5"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 h-11 px-3 rounded-xl bg-bg-elev border border-line text-ink tabular-nums focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
      />
      <Button
        size="sm"
        onClick={() => {
          const n = parseFloat(draft);
          if (Number.isFinite(n) && n > 0 && n <= 24) onSave(n);
        }}
      >
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
