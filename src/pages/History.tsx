import { useSession } from '@/store/useSession';
import { formatDuration } from '@/lib/time';
import { riskFor } from '@/lib/bac';
import { motion } from 'framer-motion';
import { ArrowRight, Angry, Frown, Meh, Smile, Laugh, type LucideIcon } from 'lucide-react';
import type { RiskLevel } from '@/types';

const RISK_DOT: Record<RiskLevel, string> = {
  green: 'bg-risk-green',
  yellow: 'bg-risk-yellow',
  red: 'bg-risk-red',
};

const RISK_TEXT: Record<RiskLevel, string> = {
  green: 'text-risk-green',
  yellow: 'text-risk-yellow',
  red: 'text-risk-red',
};

const RATING_ICON: Record<1 | 2 | 3 | 4 | 5, { icon: LucideIcon; color: string; label: string }> = {
  1: { icon: Angry, color: 'text-risk-red', label: 'Wrecked' },
  2: { icon: Frown, color: 'text-orange-600', label: 'Rough' },
  3: { icon: Meh, color: 'text-amber-600', label: 'Meh' },
  4: { icon: Smile, color: 'text-lime-700', label: 'Alright' },
  5: { icon: Laugh, color: 'text-emerald-700', label: 'Great' },
};

type Props = {
  onOpenRecap: (sessionId: string) => void;
};

export function HistoryPage({ onOpenRecap }: Props) {
  const history = useSession((s) => s.history);
  const n = history.length;

  return (
    <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28">
      <header className="mb-6">
        <div className="eyebrow">THE LEDGER</div>
        <h1 className="font-display text-[38px] leading-[1.05] tracking-[-0.02em] text-ink mt-2">
          <span className="hb-italic tabular-nums">{n}</span>{' '}
          <span>
            {n === 1 ? 'night on the record.' : 'nights on the record.'}
          </span>
        </h1>
      </header>

      {n === 0 ? (
        <div className="rounded-[20px] border border-line bg-bg-card p-8 text-center">
          <p className="font-display italic text-ink-muted text-lg leading-snug">
            Nothing logged yet.
          </p>
          <p className="text-xs text-ink-dim mt-2 tracking-wide">
            End a session and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((s, i) => {
            const totalStd = s.drinks.reduce((sum, d) => sum + d.standardDrinks, 0);
            const duration = s.endedAt && s.startedAt ? s.endedAt - s.startedAt : 0;
            const peak = s.peakBac ?? 0;
            const risk = riskFor(peak);
            const rating = s.recap?.rating;
            const canRecap = !s.recap;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-[20px] border border-line bg-bg-card overflow-hidden"
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 mt-2 ${RISK_DOT[risk]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-muted leading-tight">
                          <div>{formatStampTop(s.startedAt)}</div>
                          <div>{formatStampBottom(s.startedAt)}</div>
                        </div>
                        <div className="font-display text-[17px] text-ink mt-1 leading-snug">
                          {s.drinks.length} drinks · {totalStd.toFixed(1)} std
                        </div>
                        <div className="font-mono text-[11px] text-ink-dim mt-1.5 tracking-tight">
                          {formatDuration(duration)} · {s.water.length} water · {s.food.length} food
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono text-[22px] font-semibold tabular-nums leading-none ${RISK_TEXT[risk]}`}
                      >
                        {peak.toFixed(3)}
                      </div>
                      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim mt-1.5">
                        PEAK
                      </div>
                    </div>
                  </div>
                </div>

                {rating ? (
                  <RecapRow rating={rating} symptoms={s.recap!.symptoms.length} />
                ) : canRecap ? (
                  <button
                    onClick={() => onOpenRecap(s.id)}
                    className="w-full flex items-center justify-between gap-2 px-5 py-3 border-t border-line/70 hover:bg-bg-elev active:bg-bg-elev transition min-tap"
                  >
                    <span className="font-display italic text-[15px] text-accent">
                      How'd the morning treat you?
                    </span>
                    <ArrowRight className="h-4 w-4 text-accent" />
                  </button>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatStampTop(ms: number): string {
  const d = new Date(ms);
  const weekday = d.toLocaleDateString([], { weekday: 'short' }).toUpperCase();
  return `${weekday} ${d.getDate()}`;
}

function formatStampBottom(ms: number): string {
  return new Date(ms).toLocaleDateString([], { month: 'short' }).toUpperCase();
}

function RecapRow({ rating, symptoms }: { rating: 1 | 2 | 3 | 4 | 5; symptoms: number }) {
  const r = RATING_ICON[rating];
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 border-t border-line/70">
      <r.icon className={`h-4 w-4 ${r.color}`} />
      <span className="font-display text-[14px] text-ink">{r.label}</span>
      {symptoms > 0 && (
        <span className="font-mono text-[11px] text-ink-dim tracking-tight">
          · {symptoms} {symptoms === 1 ? 'symptom' : 'symptoms'}
        </span>
      )}
    </div>
  );
}
