import { Card } from '@/components/ui/Card';
import { formatRelative } from '@/lib/time';
import { X } from 'lucide-react';
import type { DrinkEntry } from '@/types';

type Props = {
  drinks: DrinkEntry[];
  now: number;
  onRemove: (id: string) => void;
};

export function DrinkList({ drinks, now, onRemove }: Props) {
  if (drinks.length === 0) return null;
  const total = drinks.reduce((s, d) => s + d.standardDrinks, 0);
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
          Drinks
        </h2>
        <div className="text-xs text-ink-muted tabular-nums">
          {drinks.length} · {total.toFixed(1)} std
        </div>
      </div>
      <ul className="space-y-1">
        {drinks
          .slice()
          .reverse()
          .map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between py-2 border-b border-bg-elev/50 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-ink text-sm">{d.label}</span>
                <span className="text-xs text-ink-muted tabular-nums">
                  {d.standardDrinks.toFixed(1)} std · {formatRelative(d.at, now)}
                </span>
              </div>
              <button
                onClick={() => onRemove(d.id)}
                className="text-ink-muted hover:text-risk-red p-2 min-tap"
                aria-label="Remove drink"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
      </ul>
    </Card>
  );
}
