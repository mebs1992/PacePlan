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

const TILE_ACCENT: Record<DrinkType, string> = {
  mid_beer: 'from-amber-500/30 to-amber-500/5',
  full_beer: 'from-orange-500/30 to-orange-500/5',
  wine: 'from-rose-500/30 to-rose-500/5',
  spirit: 'from-cyan-500/30 to-cyan-500/5',
  cocktail: 'from-violet-500/30 to-violet-500/5',
  custom: 'from-slate-500/30 to-slate-500/5',
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
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.2em]">
          Log a drink
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DRINK_PRESETS.map((preset) => (
          <motion.button
            key={preset.type}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            onClick={() =>
              onAdd({
                type: preset.type,
                label: preset.label,
                standardDrinks: preset.standardDrinks,
              })
            }
            className={`relative overflow-hidden flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${TILE_ACCENT[preset.type]} border border-white/10 min-tap`}
          >
            <div className="text-ink">{ICONS[preset.type]}</div>
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
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          onClick={() => setShowCustom((v) => !v)}
          className={`relative overflow-hidden flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gradient-to-br ${TILE_ACCENT.custom} border border-white/10 min-tap`}
        >
          <div className="text-ink">{ICONS.custom}</div>
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
