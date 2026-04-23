import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Angry,
  Droplets,
  Frown,
  Laugh,
  Meh,
  Smile,
  Target,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';
import { LandscapeArt, TrendSparkArt } from '@/components/illustrations/EditorialArt';
import { useSession } from '@/store/useSession';
import { helperImpacts, recappedSessions } from '@/lib/insights';
import { waterDeficit } from '@/lib/bac';
import type { HangoverRecap, Session, Symptom } from '@/types';

const RATINGS: {
  value: 1 | 2 | 3 | 4 | 5;
  label: string;
  tone: string;
  note: string;
  icon: LucideIcon;
}[] = [
  { value: 1, label: 'Wrecked', tone: 'text-risk-red', note: 'Hard landing.', icon: Angry },
  { value: 2, label: 'Rough', tone: 'text-risk-red', note: 'Pretty dusty.', icon: Frown },
  { value: 3, label: 'Meh', tone: 'text-risk-yellow', note: 'Could go either way.', icon: Meh },
  { value: 4, label: 'Alright', tone: 'text-risk-green', note: 'Better than expected.', icon: Smile },
  { value: 5, label: 'Great', tone: 'text-risk-green', note: 'Very clean landing.', icon: Laugh },
];

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

type InsightCardModel = {
  title: string;
  body: string;
  accent: string;
  icon: LucideIcon;
};

export function MorningRecap({ sessionId, onDismiss }: Props) {
  const history = useSession((s) => s.history);
  const submitRecap = useSession((s) => s.submitRecap);
  const session = useMemo(
    () => history.find((entry) => entry.id === sessionId),
    [history, sessionId],
  );

  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [symptoms, setSymptoms] = useState<Set<Symptom>>(new Set());
  const [note, setNote] = useState('');

  const insight = useMemo(
    () => (session ? buildRecapInsight(session, history) : null),
    [history, session],
  );
  const trend = useMemo(
    () => buildTrendModel(history),
    [history],
  );

  if (!session || !insight) return null;

  const totalStd = session.drinks.reduce((sum, drink) => sum + drink.standardDrinks, 0);
  const ratingMeta = rating !== null ? RATINGS.find((item) => item.value === rating)! : null;

  function toggle(symptom: Symptom) {
    const next = new Set(symptoms);
    if (next.has(symptom)) {
      next.delete(symptom);
    } else {
      if (symptom === 'fine') {
        next.clear();
        next.add('fine');
      } else {
        next.delete('fine');
        next.add(symptom);
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

  const InsightIcon = insight.icon;
  const RatingIcon = ratingMeta?.icon;

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
              <div className="eyebrow">MORNING RECAP</div>
              <div className="font-mono text-[12px] text-ink-muted mt-1 tracking-tight">
                {new Date(session.startedAt).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
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
            className="font-display text-[42px] leading-[1.02] tracking-[-0.03em] text-ink mt-6"
          >
            Morning recap
          </motion.h1>
          <p className="font-display italic text-[16px] text-ink-muted mt-2 leading-snug">
            See the pattern. Get better.
          </p>

          <section className="mt-6 rounded-[28px] border border-line bg-bg-card overflow-hidden shadow-card">
            <div className="px-5 pt-5 pb-4">
              <div className="eyebrow">LAST NIGHT</div>
              <div className="grid grid-cols-3 gap-3 mt-3 items-end">
                <MetricColumn
                  label="PLANNED"
                  value={
                    typeof session.plannedDrinkCap === 'number'
                      ? drinkCountLabel(session.plannedDrinkCap)
                      : 'No cap'
                  }
                />
                <div className="font-display text-[30px] leading-none text-ink-muted text-center pb-1">
                  →
                </div>
                <MetricColumn
                  label="LOGGED"
                  value={`${session.drinks.length} drinks`}
                  sub={`${totalStd.toFixed(1)} std`}
                />
              </div>
            </div>

            <div className="mx-5 rounded-[24px] overflow-hidden border border-line bg-[#F3EBDD]">
              <LandscapeArt />
            </div>

            <div className="px-5 py-5 border-t border-line mt-4">
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 rounded-full border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: `${insight.accent}33`,
                    background: `${insight.accent}10`,
                    color: insight.accent,
                  }}
                >
                  <InsightIcon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="eyebrow">WHAT MOVED THE LINE</div>
                  <div className="font-display text-[28px] leading-[1.08] tracking-[-0.03em] text-ink mt-2">
                    {insight.title}
                  </div>
                  <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-2">
                    {insight.body}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-[24px] border border-line bg-bg-card p-4">
              <div className="eyebrow">MORNING FEEL</div>
              <div className="flex items-center gap-3 mt-4">
                <div className="h-11 w-11 rounded-full border border-line bg-[#F3EBDD] flex items-center justify-center">
                  {RatingIcon ? (
                    <RatingIcon className={`h-5 w-5 ${ratingMeta?.tone ?? 'text-ink-muted'}`} strokeWidth={1.8} />
                  ) : (
                    <Smile className="h-5 w-5 text-ink-dim" strokeWidth={1.8} />
                  )}
                </div>
                <div>
                  <div className="font-display text-[36px] leading-none tracking-[-0.04em] text-ink">
                    {rating ?? '—'}/5
                  </div>
                  <div className="font-display italic text-[15px] leading-snug text-ink-muted mt-1">
                    {ratingMeta ? ratingMeta.note : 'Pick your 1-5 feel below.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-bg-card p-4 overflow-hidden">
              <div className="eyebrow">PATTERN TREND</div>
              <div className="h-[72px] mt-3 rounded-[18px] overflow-hidden bg-[#F7EFE2]">
                <TrendSparkArt />
              </div>
              <div className="font-display text-[22px] leading-[1.05] tracking-[-0.03em] text-ink mt-3">
                {trend.title}
              </div>
              <div className="font-display italic text-[14px] leading-snug text-ink-muted mt-1">
                {trend.body}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-3">VERDICT</div>
            <div className="grid grid-cols-5 gap-1.5">
              {RATINGS.map((item) => {
                const active = rating === item.value;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRating(item.value)}
                    className={`rounded-[18px] border px-2 py-3 text-center transition ${
                      active
                        ? 'border-accent bg-accent/10 shadow-press'
                        : 'border-line bg-bg-card hover:bg-bg-elev'
                    }`}
                  >
                    <ItemIcon
                      className={`h-4 w-4 mx-auto ${active ? item.tone : 'text-ink-dim'}`}
                      strokeWidth={1.9}
                    />
                    <div className={`font-display text-[24px] leading-none mt-2 ${active ? 'text-ink' : 'text-ink-muted'}`}>
                      {item.value}
                    </div>
                    <div className={`font-mono text-[9px] uppercase tracking-[0.12em] mt-1 ${active ? 'text-ink' : 'text-ink-dim'}`}>
                      {item.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="font-display italic text-[14px] leading-snug text-ink-muted mt-3">
              One honest rating helps future forecasts get sharper.
            </p>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-3">SYMPTOMS</div>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((item) => {
                const active = symptoms.has(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggle(item.key)}
                    className={`px-3.5 py-2 rounded-full border text-[13px] transition ${
                      active
                        ? 'border-ink bg-ink text-bg-card'
                        : 'border-line bg-bg-card text-ink-muted hover:bg-bg-elev'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="eyebrow mb-3">ANYTHING ELSE</div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="what you'd do differently. optional."
              rows={3}
              className="w-full px-4 py-3 rounded-[18px] bg-bg-card border border-line text-ink placeholder:text-ink-dim placeholder:font-mono placeholder:text-[12px] focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 transition resize-none"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={rating === null}
            className="w-full h-[52px] mt-6 rounded-full bg-accent text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-95 transition min-tap"
          >
            Finish recap
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

function MetricColumn({
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
      <div className="font-display text-[28px] leading-[1.02] tracking-[-0.03em] text-ink mt-2">
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] text-ink-dim mt-1 tracking-tight">
          {sub}
        </div>
      )}
    </div>
  );
}

function buildRecapInsight(session: Session, history: Session[]): InsightCardModel {
  const overCap =
    typeof session.plannedDrinkCap === 'number' &&
    session.drinks.length > session.plannedDrinkCap;
  const mealLogged = session.food.some((entry) => entry.size === 'meal');
  const fullyWatered = waterDeficit(session.drinks, session.water.length) === 0;
  const strongestHelper = helperImpacts(history)
    .filter((item) => item.delta > 0.25)
    .sort((a, b) => b.delta - a.delta)[0];

  if (overCap) {
    return {
      title: 'Going over the cap likely heated the landing.',
      body: `You planned ${drinkCountLabel(session.plannedDrinkCap!)} and logged ${drinkCountLabel(session.drinks.length)}.`,
      accent: '#8C3A2A',
      icon: Target,
    };
  }

  if (fullyWatered) {
    return {
      title: 'Hydration probably bought you more room.',
      body: 'You kept up with water through the session, which is one of the cleaner levers in this app.',
      accent: '#6F8D83',
      icon: Droplets,
    };
  }

  if (mealLogged) {
    return {
      title: 'Eating first likely helped the curve stay softer.',
      body: 'A real meal usually gives the night more margin than trying to slow down mid-stream.',
      accent: '#A58A57',
      icon: Utensils,
    };
  }

  if (strongestHelper) {
    return {
      title: `${strongestHelper.label} is still the best lever you have.`,
      body: `${strongestHelper.label} improves recaps by ${strongestHelper.delta.toFixed(1)} points on average in your history.`,
      accent: '#6F8D83',
      icon: strongestHelper.label.includes('meal') ? Utensils : Droplets,
    };
  }

  return {
    title: 'This recap helps tighten the line for next time.',
    body: 'The more mornings you log, the more the app can coach from your real pattern instead of generic heuristics.',
    accent: '#A58A57',
    icon: Target,
  };
}

function buildTrendModel(history: Session[]): { title: string; body: string } {
  const recapped = recappedSessions(history);
  if (recapped.length < 3) {
    return {
      title: 'Pattern still forming',
      body: 'A few more honest mornings and the signal gets sharper.',
    };
  }

  const recent = recapped.slice(0, 3).map((entry) => entry.recap!.rating);
  const previous = recapped.slice(3, 6).map((entry) => entry.recap!.rating);
  if (previous.length === 0) {
    return {
      title: 'New baseline coming in',
      body: 'You have enough data to start noticing your cleaner nights.',
    };
  }

  const recentAvg = average(recent);
  const previousAvg = average(previous);
  const delta = recentAvg - previousAvg;

  if (delta >= 0.35) {
    return {
      title: 'Getting steadier',
      body: 'Recent mornings are landing a little cleaner than your earlier ones.',
    };
  }

  if (delta <= -0.35) {
    return {
      title: 'A bit rougher lately',
      body: 'Recent recaps have dipped, so the small habits matter more right now.',
    };
  }

  return {
    title: 'Holding steady',
    body: 'The recent pattern looks pretty consistent from night to night.',
  };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function drinkCountLabel(count: number): string {
  return `${count} drink${count === 1 ? '' : 's'}`;
}
