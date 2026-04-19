import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Angry,
  Frown,
  Meh,
  Smile,
  Laugh,
  Sunrise,
  X,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate, formatDuration } from '@/lib/time';
import { useSession } from '@/store/useSession';
import type { HangoverRecap, Symptom } from '@/types';

const RATINGS: { value: 1 | 2 | 3 | 4 | 5; label: string; icon: LucideIcon; color: string; bg: string }[] = [
  { value: 1, label: 'Wrecked', icon: Angry, color: 'text-risk-red', bg: 'bg-rose-50 border-rose-200' },
  { value: 2, label: 'Rough', icon: Frown, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  { value: 3, label: 'Meh', icon: Meh, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { value: 4, label: 'Alright', icon: Smile, color: 'text-lime-700', bg: 'bg-lime-50 border-lime-200' },
  { value: 5, label: 'Great', icon: Laugh, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
];

const SYMPTOMS: { key: Symptom; label: string }[] = [
  { key: 'headache', label: 'Headache' },
  { key: 'nausea', label: 'Nausea' },
  { key: 'tired', label: 'Tired' },
  { key: 'queasy', label: 'Queasy' },
  { key: 'dehydrated', label: 'Dehydrated' },
  { key: 'anxious', label: 'Anxious' },
  { key: 'fine', label: 'Feel fine' },
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
    [history, sessionId]
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
        <div className="max-w-md mx-auto p-4 pb-12">
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Sunrise className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-ink-muted">Morning recap</div>
                <div className="text-sm font-bold text-ink tracking-tight">
                  {formatDate(session.startedAt)}
                </div>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="h-10 w-10 rounded-full flex items-center justify-center text-ink-muted hover:bg-ink/5 transition"
              aria-label="Skip"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-ink tracking-tight mt-6"
          >
            Good morning.
          </motion.h1>
          <p className="text-ink-muted text-[15px] mt-1">
            Quick check-in to learn how your body actually handled last night.
          </p>

          <div className="mt-5 rounded-2xl bg-bg-card border border-line shadow-card p-4">
            <div className="text-[11px] font-semibold text-ink-muted">Last night</div>
            <div className="grid grid-cols-3 gap-3 mt-2">
              <Stat label="Peak BAC" value={`${(session.peakBac ?? 0).toFixed(3)}%`} />
              <Stat label="Drinks" value={`${session.drinks.length}`} sub={`${totalStd.toFixed(1)} std`} />
              <Stat label="Duration" value={formatDuration(duration)} />
            </div>
            {session.predictedRisk && (
              <div className="mt-3 text-xs text-ink-muted">
                We predicted:{' '}
                <span className="font-semibold text-ink capitalize">
                  {session.predictedRisk}
                </span>{' '}
                hangover
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="text-sm font-bold text-ink">How do you feel?</div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {RATINGS.map((r) => {
                const active = rating === r.value;
                return (
                  <motion.button
                    key={r.value}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setRating(r.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border transition-all ${
                      active
                        ? `${r.bg} border-opacity-100 shadow-card`
                        : 'bg-bg-card border-line hover:bg-bg-elev'
                    }`}
                  >
                    <r.icon
                      className={`h-7 w-7 ${active ? r.color : 'text-ink-muted'}`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <span
                      className={`text-[11px] font-bold tracking-tight ${
                        active ? 'text-ink' : 'text-ink-muted'
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
            <div className="text-sm font-bold text-ink">Any symptoms?</div>
            <div className="text-xs text-ink-muted mt-0.5">Tap any that apply.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const active = symptoms.has(s.key);
                return (
                  <motion.button
                    key={s.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggle(s.key)}
                    className={`h-10 px-4 rounded-full text-sm font-semibold transition-all min-tap ${
                      active
                        ? 'bg-ink text-white border border-ink'
                        : 'bg-bg-card text-ink border border-line hover:bg-bg-elev'
                    }`}
                  >
                    {s.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-bold text-ink">Anything else?</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional — sleep quality, what worked, what didn't…"
              rows={3}
              className="mt-2 w-full px-4 py-3 rounded-2xl bg-bg-elev border border-line text-ink placeholder:text-ink-dim focus:border-accent focus:bg-white focus:outline-none focus:ring-4 focus:ring-accent/15 transition resize-none"
            />
          </div>

          <div className="mt-6 space-y-2">
            <Button className="w-full" size="lg" onClick={submit} disabled={rating === null}>
              <Check className="h-5 w-5 mr-1.5" />
              Save recap
            </Button>
            <button
              onClick={onDismiss}
              className="w-full h-11 text-sm font-semibold text-ink-muted hover:text-ink transition"
            >
              Skip for now
            </button>
          </div>

          <p className="text-xs text-ink-dim text-center mt-4 leading-relaxed">
            Your feedback trains a personal model — the more recaps you log,
            the more accurate your forecasts get.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-ink-muted">{label}</div>
      <div className="text-base font-bold text-ink tabular-nums tracking-tight mt-0.5">
        {value}
      </div>
      {sub && <div className="text-[10px] text-ink-dim tabular-nums">{sub}</div>}
    </div>
  );
}
