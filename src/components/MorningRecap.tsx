import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/time';
import { hangoverLabel } from '@/lib/bac';
import { useSession } from '@/store/useSession';
import type { HangoverRecap, Symptom } from '@/types';

const RATINGS: { value: 1 | 2 | 3 | 4 | 5; label: string; color: string }[] = [
  { value: 1, label: 'Wrecked', color: 'text-risk-red' },
  { value: 2, label: 'Rough', color: 'text-risk-red' },
  { value: 3, label: 'Meh', color: 'text-risk-yellow' },
  { value: 4, label: 'Alright', color: 'text-risk-green' },
  { value: 5, label: 'Great', color: 'text-risk-green' },
];

const RATING_BORDER: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'border-risk-red',
  2: 'border-risk-red',
  3: 'border-risk-yellow',
  4: 'border-risk-green',
  5: 'border-risk-green',
};

const SYMPTOMS: { key: Symptom; label: string }[] = [
  { key: 'headache', label: 'Headache' },
  { key: 'nausea', label: 'Nausea' },
  { key: 'tired', label: 'Tired' },
  { key: 'queasy', label: 'Queasy' },
  { key: 'dehydrated', label: 'Dehydrated' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'fine', label: 'Fine' },
];

type Props = {
  sessionId: string;
  onDismiss: () => void;
};

export function MorningRecap({ sessionId, onDismiss }: Props) {
  const history = useSession((s) => s.history);
  const submitRecap = useSession((s) => s.submitRecap);
  const session = useMemo(
    () => history.find((s) => s.id === sessionId),
    [history, sessionId],
  );

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [symptoms, setSymptoms] = useState<Set<Symptom>>(new Set());
  const [note, setNote] = useState('');

  if (!session) return null;

  const totalStd = session.drinks.reduce((s, d) => s + d.standardDrinks, 0);
  const duration = session.endedAt ? session.endedAt - session.startedAt : 0;

  function toggle(s: Symptom) {
    const next = new Set(symptoms);
    if (next.has(s)) {
      next.delete(s);
    } else {
      if (s === 'fine') {
        next.clear();
        next.add('fine');
      } else {
        next.delete('fine');
        next.add(s);
      }
    }
    setSymptoms(next);
  }

  function submit() {
    if (rating === null) return;
    const recap: HangoverRecap = {
      rating,
      symptoms: Array.from(symptoms),
      note: note.trim() || undefined,
      submittedAt: Date.now(),
    };
    submitRecap(sessionId, recap);
    onDismiss();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-bg-solid overflow-y-auto"
      >
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-12">
          <div className="flex items-start justify-between pt-2">
            <div>
              <div className="eyebrow">GOOD MORNING</div>
              <div className="font-mono text-[12px] text-ink-muted mt-1 tracking-tight">
                {formatDate(session.startedAt)}
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="h-10 w-10 rounded-full border border-line bg-bg-card text-ink-muted hover:bg-bg-elev flex items-center justify-center transition"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-[44px] leading-[1.02] tracking-[-0.02em] text-ink mt-6"
          >
            So.{' '}
            <span className="hb-italic text-accent">How rough</span> are we?
          </motion.h1>
          <p className="font-display italic text-[14px] text-ink-muted mt-2 leading-snug">
            One honest answer helps the forecast get smarter.
          </p>

          <div className="mt-6 rounded-[20px] border border-line bg-bg-card p-5">
            <div className="eyebrow mb-3">LAST NIGHT</div>
            <div className="grid grid-cols-3 gap-3">
              <MetricCell label="PEAK" value={(session.peakBac ?? 0).toFixed(3)} />
              <MetricCell
                label="DRINKS"
                value={String(session.drinks.length)}
                sub={`${totalStd.toFixed(1)} std`}
              />
              <MetricCell label="DURATION" value={formatDuration(duration)} />
            </div>
            {session.predictedRisk && (
              <div className="font-mono text-[11px] text-ink-dim mt-4 tracking-tight">
                we forecast ·{' '}
                <span className="text-ink-muted">
                  {hangoverLabel(session.predictedRisk).toLowerCase()}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-2">VERDICT</div>
            <div className="grid grid-cols-5 gap-1.5">
              {RATINGS.map((r) => {
                const active = rating === r.value;
                return (
                  <motion.button
                    key={r.value}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setRating(r.value)}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-[14px] border transition-all ${
                      active
                        ? `${RATING_BORDER[r.value]} bg-bg-card shadow-press`
                        : 'border-line bg-bg-elev hover:bg-bg-card'
                    }`}
                  >
                    <span
                      className={`font-display tabular-nums text-[22px] leading-none ${
                        active ? r.color : 'text-ink-muted'
                      }`}
                    >
                      {r.value}
                    </span>
                    <span
                      className={`font-mono text-[9px] tracking-[0.12em] mt-1 uppercase ${
                        active ? 'text-ink' : 'text-ink-dim'
                      }`}
                    >
                      {r.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-2">SYMPTOMS</div>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS.map((s) => {
                const active = symptoms.has(s.key);
                return (
                  <motion.button
                    key={s.key}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggle(s.key)}
                    className={`px-3.5 py-2 rounded-full text-[13px] transition ${
                      active
                        ? 'bg-ink text-bg-card border border-ink'
                        : 'bg-transparent text-ink-muted border border-line hover:border-line-2'
                    }`}
                  >
                    {s.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-2">ANYTHING ELSE</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="what you'd do differently. optional."
              rows={3}
              className="w-full px-4 py-3 rounded-[14px] bg-bg-card border border-line text-ink placeholder:text-ink-dim placeholder:font-mono placeholder:text-[12px] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 transition resize-none"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={rating === null}
            className="w-full h-[52px] mt-6 rounded-full bg-ink text-bg-card font-display italic text-[17px] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-95 transition min-tap"
          >
            Save the verdict
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="w-full h-11 mt-1.5 font-mono text-[11px] tracking-[0.14em] uppercase text-ink-dim hover:text-ink transition"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function MetricCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim">
        {label}
      </div>
      <div className="font-display tabular-nums text-[22px] text-ink leading-none mt-1.5">
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] text-ink-dim tabular-nums mt-0.5 tracking-tight">
          {sub}
        </div>
      )}
    </div>
  );
}
