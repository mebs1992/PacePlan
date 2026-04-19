import { Card } from '@/components/ui/Card';
import { useSession } from '@/store/useSession';
import { formatDate, formatDuration } from '@/lib/time';
import { riskFor } from '@/lib/bac';
import { motion } from 'framer-motion';
import { ChevronRight, Angry, Frown, Meh, Smile, Laugh, type LucideIcon } from 'lucide-react';
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

  return (
    <div className="max-w-md mx-auto p-4 pb-28">
      <header className="mt-6 mb-5">
        <h1 className="text-3xl font-bold text-ink tracking-tight">History</h1>
        <p className="text-ink-muted text-sm mt-1">
          {history.length === 0
            ? 'No sessions yet.'
            : `${history.length} session${history.length === 1 ? '' : 's'} logged.`}
        </p>
      </header>

      {history.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-sm text-center py-10">
            Your past sessions will show up here once you end one.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
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
              >
                <Card className="p-0 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${RISK_DOT[risk]}`}
                          />
                          <span className="text-ink font-semibold tracking-tight">
                            {formatDate(s.startedAt)}
                          </span>
                        </div>
                        <div className="text-xs text-ink-muted mt-1.5 tabular-nums pl-4">
                          {formatDuration(duration)} · {s.drinks.length} drinks ·{' '}
                          {totalStd.toFixed(1)} std
                        </div>
                        <div className="text-xs text-ink-dim mt-0.5 pl-4">
                          {s.water.length} water · {s.food.length} food
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div
                          className={`text-2xl font-bold tabular-nums tracking-tight ${RISK_TEXT[risk]}`}
                        >
                          {peak.toFixed(3)}%
                        </div>
                        <div className="text-[10px] text-ink-dim font-medium mt-0.5">
                          peak BAC
                        </div>
                      </div>
                    </div>
                  </div>

                  {rating ? (
                    <RecapRow rating={rating} symptoms={s.recap!.symptoms.length} />
                  ) : canRecap ? (
                    <button
                      onClick={() => onOpenRecap(s.id)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-bg-elev border-t border-line hover:bg-white active:bg-bg-deep transition min-tap"
                    >
                      <span className="text-sm font-semibold text-accent">
                        How did you feel the next day?
                      </span>
                      <ChevronRight className="h-4 w-4 text-accent" />
                    </button>
                  ) : null}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecapRow({ rating, symptoms }: { rating: 1 | 2 | 3 | 4 | 5; symptoms: number }) {
  const r = RATING_ICON[rating];
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-elev border-t border-line">
      <r.icon className={`h-5 w-5 ${r.color}`} />
      <span className="text-sm font-semibold text-ink">{r.label}</span>
      {symptoms > 0 && (
        <span className="text-xs text-ink-muted">
          · {symptoms} {symptoms === 1 ? 'symptom' : 'symptoms'}
        </span>
      )}
    </div>
  );
}
