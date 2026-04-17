import { useState } from 'react';
import { DRINK_PRESETS } from '@/lib/drinks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Beer, Wine, Plus, Martini, GlassWater } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DrinkType } from '@/types';

const ICONS: Record<DrinkType, React.ReactNode> = {
  mid_beer: <Beer className="h-6 w-6" />,
  full_beer: <Beer className="h-6 w-6" />,
  wine: <Wine className="h-6 w-6" />,
  spirit: <GlassWater className="h-6 w-6" />,
  cocktail: <Martini className="h-6 w-6" />,
  custom: <Plus className="h-6 w-6" />,
};

type Props = {
  onAdd: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
};

export function DrinkPicker({ onAdd }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStd, setCustomStd] = useState('1.0');

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider">
          Log a drink
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DRINK_PRESETS.map((preset) => (
          <button
            key={preset.type}
            onClick={() =>
              onAdd({
                type: preset.type,
                label: preset.label,
                standardDrinks: preset.standardDrinks,
              })
            }
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-elev hover:bg-bg-elev/80 active:scale-95 transition min-tap'
            )}
          >
            <div className="text-accent">{ICONS[preset.type]}</div>
            <div className="text-sm font-medium text-ink">{preset.label}</div>
            <div className="text-[10px] text-ink-muted leading-tight text-center">
              {preset.sublabel}
            </div>
            <div className="text-[10px] text-ink-dim tabular-nums">
              {preset.standardDrinks} std
            </div>
          </button>
        ))}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-bg-elev hover:bg-bg-elev/80 active:scale-95 transition min-tap"
        >
          <div className="text-accent">{ICONS.custom}</div>
          <div className="text-sm font-medium text-ink">Custom</div>
        </button>
      </div>

      {showCustom && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            value={customStd}
            onChange={(e) => setCustomStd(e.target.value)}
            placeholder="Standard drinks"
          />
          <Button
            size="md"
            onClick={() => {
              const n = parseFloat(customStd);
              if (!Number.isFinite(n) || n <= 0) return;
              onAdd({ type: 'custom', label: 'Custom', standardDrinks: n });
              setShowCustom(false);
              setCustomStd('1.0');
            }}
          >
            Add
          </Button>
        </div>
      )}
    </Card>
  );
}
