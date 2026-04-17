import { Card } from '@/components/ui/Card';
import { useSession } from '@/store/useSession';
import { formatDate, formatDuration } from '@/lib/time';
import { riskFor } from '@/lib/bac';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/types';

const DOT_COLOR: Record<RiskLevel, string> = {
  green: 'bg-risk-green',
  yellow: 'bg-risk-yellow',
  red: 'bg-risk-red',
};

export function HistoryPage() {
  const history = useSession((s) => s.history);

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <header className="my-4">
        <h1 className="text-2xl font-bold text-ink">History</h1>
        <p className="text-ink-muted text-sm">Last {history.length} sessions.</p>
      </header>
      {history.length === 0 ? (
        <Card>
          <p className="text-ink-muted text-sm text-center py-6">
            No sessions yet. Start one from the Session tab.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((s) => {
            const totalStd = s.drinks.reduce((sum, d) => sum + d.standardDrinks, 0);
            const duration =
              s.endedAt && s.startedAt ? s.endedAt - s.startedAt : 0;
            const peak = s.peakBac ?? 0;
            const risk = riskFor(peak);
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-ink font-medium">{formatDate(s.startedAt)}</div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {formatDuration(duration)} · {s.drinks.length} drinks ·{' '}
                      {totalStd.toFixed(1)} std
                    </div>
                    <div className="text-xs text-ink-muted">
                      {s.water.length} glasses water · {s.food.length} food entries
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('h-2.5 w-2.5 rounded-full', DOT_COLOR[risk])}
                      aria-hidden
                    />
                    <span className="text-sm tabular-nums text-ink">
                      peak {peak.toFixed(3)}%
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
