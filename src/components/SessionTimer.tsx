import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/time';
import { Pencil, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const pct = Math.min(100, (elapsedMs / Math.max(expectedMs, 1)) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            Session
          </div>
          <div className="text-ink mt-1 tabular-nums text-sm">
            <span className="font-semibold">{formatDuration(elapsedMs)}</span>
            <span className="text-ink-muted"> elapsed · </span>
            <span className="font-semibold">{formatDuration(remainingMs)}</span>
            <span className="text-ink-muted"> left</span>
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => {
              setDraft(String(expectedHours));
              setEditing(true);
            }}
            className="flex items-center gap-1.5 text-ink-muted text-sm h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 min-tap transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="tabular-nums">{expectedHours}h</span>
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
              className="w-20 h-10 px-2 rounded-lg bg-white/10 text-ink text-center border border-accent"
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const n = parseFloat(draft);
                if (Number.isFinite(n) && n > 0 && n <= 24) onChangeHours(n);
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
      <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-accent-violet"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </Card>
  );
}
