import { useState } from 'react';
import { DRINK_PRESETS } from '@/lib/drinks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Beer, Wine, Plus, Martini, GlassWater } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DrinkType } from '@/types';

const ICONS: Record<DrinkType, React.ReactNode> = {
  mid_beer: <Beer className="h-5 w-5" />,
  full_beer: <Beer className="h-5 w-5" />,
  wine: <Wine className="h-5 w-5" />,
  spirit: <GlassWater className="h-5 w-5" />,
  cocktail: <Martini className="h-5 w-5" />,
  custom: <Plus className="h-5 w-5" />,
};

const TILE_COLOR: Record<DrinkType, string> = {
  mid_beer: 'text-amber-600',
  full_beer: 'text-orange-600',
  wine: 'text-rose-600',
  spirit: 'text-sky-700',
  cocktail: 'text-fuchsia-700',
  custom: 'text-ink-muted',
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
        <h2 className="text-base font-semibold text-ink">Log a drink</h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DRINK_PRESETS.map((preset) => (
          <motion.button
            key={preset.type}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={() =>
              onAdd({
                type: preset.type,
                label: preset.label,
                standardDrinks: preset.standardDrinks,
              })
            }
            className="relative flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-bg-elev border border-line hover:bg-white active:bg-bg-deep min-tap transition"
          >
            <div className={TILE_COLOR[preset.type]}>{ICONS[preset.type]}</div>
            <div className="text-[13px] font-semibold text-ink leading-tight">
              {preset.label}
            </div>
            <div className="text-[10px] text-ink-muted leading-tight text-center">
              {preset.sublabel}
            </div>
            <div className="text-[10px] text-ink-dim tabular-nums">
              {preset.standardDrinks} std
            </div>
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          onClick={() => setShowCustom((v) => !v)}
          className="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-bg-elev border border-dashed border-ink/20 hover:bg-white active:bg-bg-deep min-tap transition"
        >
          <div className={TILE_COLOR.custom}>{ICONS.custom}</div>
          <div className="text-[13px] font-semibold text-ink">Custom</div>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2">
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
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
