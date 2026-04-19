import { useState } from 'react';
import { DRINK_PRESETS } from '@/lib/drinks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import type { DrinkType } from '@/types';

const ICONS: Record<DrinkType, (c: string) => React.ReactNode> = {
  mid_beer: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h10l-1 13H8L7 7zM7 7V5h10v2M11 11v5M14 11v5M17 9h2a2 2 0 012 2v4a2 2 0 01-2 2h-2" />
    </svg>
  ),
  full_beer: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5h10l-1 15H8L7 5zM17 8h2a2 2 0 012 2v5a2 2 0 01-2 2h-2M10 9v7M14 9v7" />
    </svg>
  ),
  wine: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8l-1 7a4 4 0 01-3 4v6M7 21h10M12 14a4 4 0 003-4L14 3" />
    </svg>
  ),
  spirit: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8v5c0 4-4 4-4 8v6M8 3v5c0 4 4 4 4 8M7 21h10" />
    </svg>
  ),
  cocktail: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16l-8 8-8-8zM12 13v7M8 20h8" />
    </svg>
  ),
  custom: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

type Props = {
  onAdd: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
};

export function DrinkPicker({ onAdd }: Props) {
  const [showCustom, setShowCustom] = useState(false);
  const [customStd, setCustomStd] = useState('1.0');

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {DRINK_PRESETS.map((preset) => (
          <motion.button
            key={preset.type}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={() =>
              onAdd({
                type: preset.type,
                label: preset.label,
                standardDrinks: preset.standardDrinks,
              })
            }
            className="flex items-center gap-3 p-3.5 rounded-[16px] bg-bg-elev border border-line hover:bg-bg-card active:bg-bg-card transition text-left min-tap"
          >
            <span className="text-accent shrink-0">{ICONS[preset.type]('currentColor')}</span>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[16px] leading-none text-ink">
                {preset.label}
              </div>
              <div className="font-mono text-[10px] text-ink-dim leading-tight mt-1.5 tracking-tight">
                {preset.sublabel} · {preset.standardDrinks} std
              </div>
            </div>
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={() => setShowCustom((v) => !v)}
          className="col-span-2 flex items-center gap-3 p-3.5 rounded-[16px] bg-bg-elev border border-dashed border-line-2 hover:bg-bg-card active:bg-bg-card transition text-left min-tap"
        >
          <span className="text-ink-muted shrink-0">{ICONS.custom('currentColor')}</span>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[16px] leading-none text-ink">Custom</div>
            <div className="font-mono text-[10px] text-ink-dim leading-tight mt-1.5 tracking-tight">
              Enter specific standard drinks
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
