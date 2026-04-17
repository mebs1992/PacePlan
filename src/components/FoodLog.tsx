import { Card } from '@/components/ui/Card';
import { Cookie, UtensilsCrossed } from 'lucide-react';
import { formatRelative } from '@/lib/time';
import type { FoodEntry } from '@/types';

type Props = {
  entries: FoodEntry[];
  now: number;
  onAdd: (size: 'snack' | 'meal') => void;
};

export function FoodLog({ entries, now, onAdd }: Props) {
  const last = entries[entries.length - 1];
  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-2">
        Food
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onAdd('snack')}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-bg-elev hover:bg-bg-elev/80 active:scale-95 transition min-tap"
        >
          <Cookie className="h-5 w-5 text-accent" />
          <span className="text-ink font-medium">Snack</span>
        </button>
        <button
          onClick={() => onAdd('meal')}
          className="flex items-center justify-center gap-2 h-12 rounded-xl bg-bg-elev hover:bg-bg-elev/80 active:scale-95 transition min-tap"
        >
          <UtensilsCrossed className="h-5 w-5 text-accent" />
          <span className="text-ink font-medium">Meal</span>
        </button>
      </div>
      {last && (
        <div className="mt-2 text-xs text-ink-muted">
          Last: {last.size} · {formatRelative(last.at, now)}
        </div>
      )}
    </Card>
  );
}
