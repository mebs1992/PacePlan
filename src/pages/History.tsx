import { Card } from '@/components/ui/Card';
import { useSession } from '@/store/useSession';
import { formatDate, formatDuration } from '@/lib/time';
import { riskFor } from '@/lib/bac';
import { motion } from 'framer-motion';
import type { RiskLevel } from '@/types';

const RISK_BG: Record<RiskLevel, string> = {
  green: 'from-risk-green/20 to-risk-green/5 border-risk-green/30',
  yellow: 'from-risk-yellow/20 to-risk-yellow/5 border-risk-yellow/30',
  red: 'from-risk-red/20 to-risk-red/5 border-risk-red/30',
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
      <header className="mt-6 mb-4">
        <h1 className="text-3xl font-bold text-ink">History</h1>
        <p className="text-ink-muted text-sm mt-1">
          {history.length === 0
            ? 'No sessions yet.'
            : `Last ${history.length} session${history.length === 1 ? '' : 's'}.`}
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
                <div
                  className={`relative overflow-hidden rounded-2xl p-4 glass bg-gradient-to-br ${RISK_BG[risk]} border`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-ink font-semibold">{formatDate(s.startedAt)}</div>
                      <div className="text-xs text-ink-muted mt-1 tabular-nums">
                        {formatDuration(duration)} · {s.drinks.length} drinks ·{' '}
                        {totalStd.toFixed(1)} std
                      </div>
                      <div className="text-xs text-ink-dim mt-0.5">
                        {s.water.length} water · {s.food.length} food
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold tabular-nums ${RISK_TEXT[risk]}`}>
                        {peak.toFixed(3)}%
                      </div>
                      <div className="text-[10px] text-ink-dim uppercase tracking-wider">
                        peak BAC
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
