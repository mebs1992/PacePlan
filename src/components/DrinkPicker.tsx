import { useState } from 'react';
import { DRINK_PRESETS } from '@/lib/drinks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Beer, Wine, Plus, Martini, GlassWater } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DrinkType } from '@/types';

const ICONS: Record<DrinkType, React.ReactNode> = {
  mid_beer: <Beer className="h-6 w-6" />,
  full_beer: <Beer className="h-6 w-6" />,
  wine: <Wine className="h-6 w-6" />,
  spirit: <GlassWater className="h-6 w-6" />,
  cocktail: <Martini className="h-6 w-6" />,
  custom: <Plus className="h-6 w-6" />,
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
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {DRINK_PRESETS.map((preset) => (
          <motion.button
            key={preset.type}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={() =>
              onAdd({
                type: preset.type,
                label: preset.label,
                standardDrinks: preset.standardDrinks,
              })
            }
            className="relative flex items-center gap-3 p-3.5 rounded-2xl bg-bg-elev border border-line hover:bg-white active:bg-bg-deep min-tap transition text-left"
          >
            <div className={TILE_COLOR[preset.type]}>{ICONS[preset.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink leading-tight tracking-tight">
                {preset.label}
              </div>
              <div className="text-[11px] text-ink-muted leading-tight mt-0.5">
                {preset.sublabel} · {preset.standardDrinks} std
              </div>
            </div>
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          onClick={() => setShowCustom((v) => !v)}
          className="relative flex items-center gap-3 p-3.5 rounded-2xl bg-bg-elev border border-dashed border-ink/20 hover:bg-white active:bg-bg-deep min-tap transition text-left col-span-2"
        >
          <div className={TILE_COLOR.custom}>{ICONS.custom}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-ink leading-tight tracking-tight">Custom</div>
            <div className="text-[11px] text-ink-muted leading-tight mt-0.5">
              Enter a specific number of standard drinks
            </div>
          </div>
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
    </div>
  );
}
