import { Card } from '@/components/ui/Card';
import { Droplet } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  glasses: number;
  drinks: number;
  behind: boolean;
  onAdd: () => void;
};

export function WaterTracker({ glasses, drinks, behind, onAdd }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
            Water
          </h2>
          <div className="mt-1 text-ink text-base">
            <span className="tabular-nums">{glasses}</span>
            <span className="text-ink-muted text-sm"> / {drinks} drinks</span>
          </div>
          {behind && (
            <div className="mt-1 text-xs text-risk-yellow">
              Have a glass of water — you're behind.
            </div>
          )}
        </div>
        <button
          onClick={onAdd}
          className={cn(
            'flex items-center gap-2 px-4 h-12 rounded-xl bg-accent text-bg font-semibold active:scale-95 transition min-tap',
            behind && 'ring-2 ring-risk-yellow'
          )}
        >
          <Droplet className="h-5 w-5" />
          +1 glass
        </button>
      </div>
    </Card>
  );
}
