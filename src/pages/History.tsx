import { Card } from '@/components/ui/Card';
import { useSession } from '@/store/useSession';
import { formatDate, formatDuration } from '@/lib/time';
import { riskFor } from '@/lib/bac';
import { motion } from 'framer-motion';
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

export function HistoryPage() {
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
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${RISK_DOT[risk]}`} />
                        <span className="text-ink font-semibold tracking-tight">
                          {formatDate(s.startedAt)}
                        </span>
                      </div>
                      <div className="text-xs text-ink-muted mt-1.5 tabular-nums pl-4">
                        {formatDuration(duration)} · {s.drinks.length} drinks · {totalStd.toFixed(1)} std
                      </div>
                      <div className="text-xs text-ink-dim mt-0.5 pl-4">
                        {s.water.length} water · {s.food.length} food
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className={`text-2xl font-bold tabular-nums tracking-tight ${RISK_TEXT[risk]}`}>
                        {peak.toFixed(3)}%
                      </div>
                      <div className="text-[10px] text-ink-dim font-medium mt-0.5">
                        peak BAC
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
