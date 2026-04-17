import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/time';
import { Pencil, Check, X } from 'lucide-react';

type Props = {
  startedAt: number;
  expectedHours: number;
  now: number;
  onChangeHours: (h: number) => void;
};

export function SessionTimer({ startedAt, expectedHours, now, onChangeHours }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(expectedHours));

  const elapsedMs = Math.max(0, now - startedAt);
  const expectedMs = expectedHours * 60 * 60 * 1000;
  const remainingMs = Math.max(0, expectedMs - elapsedMs);
  const pct = Math.min(100, Math.round((elapsedMs / Math.max(expectedMs, 1)) * 100));

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-muted">Session</div>
          <div className="text-ink text-base mt-1 tabular-nums">
            {formatDuration(elapsedMs)} elapsed · {formatDuration(remainingMs)} left
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => {
              setDraft(String(expectedHours));
              setEditing(true);
            }}
            className="flex items-center gap-1 text-ink-muted text-sm h-10 px-3 rounded-lg hover:bg-bg-elev/40 min-tap"
          >
            <Pencil className="h-4 w-4" />
            {expectedHours}h
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              inputMode="decimal"
              min="0.5"
              max="24"
              step="0.5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-20 h-10 px-2 rounded-lg bg-bg-elev text-ink text-center"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const n = parseFloat(draft);
                if (Number.isFinite(n) && n > 0 && n <= 24) {
                  onChangeHours(n);
                }
                setEditing(false);
              }}
              aria-label="Save"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div className="mt-3 h-2 bg-bg-elev rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}
