import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlarmClock, Pencil, Check, X, Sunrise } from 'lucide-react';
import { formatClockWithDay } from '@/lib/time';

type Props = {
  wakeAtMs: number | undefined;
  now: number;
  onChange: (ms: number | undefined) => void;
};

function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string): number | null {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function defaultWake(now: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.getTime();
}

export function WakeTimePicker({ wakeAtMs, now, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() =>
    toLocalInputValue(wakeAtMs ?? defaultWake(now))
  );

  const label = useMemo(() => {
    if (!wakeAtMs) return 'Whenever';
    return formatClockWithDay(wakeAtMs, now);
  }, [wakeAtMs, now]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            {wakeAtMs ? (
              <AlarmClock className="h-5 w-5 text-accent" />
            ) : (
              <Sunrise className="h-5 w-5 text-ink-muted" />
            )}
          </div>
          <div>
            <div className="text-xs text-ink-muted">Wake up</div>
            <div className="text-ink text-base font-semibold mt-0.5">{label}</div>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setDraft(toLocalInputValue(wakeAtMs ?? defaultWake(now)));
              setEditing(true);
            }}
            className="flex items-center gap-1.5 text-ink-muted text-sm h-10 px-3 rounded-xl bg-bg-elev hover:bg-white border border-line min-tap transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <input
            type="datetime-local"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-white border border-line text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                const n = fromLocalInputValue(draft);
                if (n) onChange(n);
                setEditing(false);
              }}
            >
              <Check className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                onChange(undefined);
                setEditing(false);
              }}
            >
              No alarm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-ink-dim">
            Fewer drinks if you have to wake up earlier — we factor this into recommendations.
          </p>
        </div>
      )}
    </Card>
  );
}
