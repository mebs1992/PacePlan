import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { DrinkPanel } from '@/components/panels/DrinkPanel';
import { WaterPanel } from '@/components/panels/WaterPanel';
import { FoodPanel } from '@/components/panels/FoodPanel';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type {
  DrinkEntry,
  DrinkType,
  FoodEntry,
  FoodSize,
  WaterEntry,
} from '@/types';

export type TrackerTab = 'drink' | 'water' | 'food';

type Props = {
  open: boolean;
  onClose: () => void;
  initialTab?: TrackerTab;
  drinks: DrinkEntry[];
  water: WaterEntry[];
  food: FoodEntry[];
  behind: boolean;
  now: number;
  onAddDrink: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
  onRemoveDrink: (id: string) => void;
  onAddWater: () => void;
  onRemoveWater: (id: string) => void;
  onAddFood: (size: FoodSize) => void;
  onRemoveFood: (id: string) => void;
};

export function TrackerSheet({
  open,
  onClose,
  initialTab = 'drink',
  drinks,
  water,
  food,
  behind,
  now,
  onAddDrink,
  onRemoveDrink,
  onAddWater,
  onRemoveWater,
  onAddFood,
  onRemoveFood,
}: Props) {
  const [tab, setTab] = useState<TrackerTab>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="min-w-0">
          <div className="eyebrow">LOG</div>
          <h2 className="font-display text-[26px] leading-[1.05] tracking-[-0.02em] text-ink mt-1">
            Add to the <span className="hb-italic text-accent">ledger.</span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-full bg-bg-elev border border-line mb-5">
        <SegButton active={tab === 'drink'} onClick={() => setTab('drink')} label="Drink" count={drinks.length} />
        <SegButton
          active={tab === 'water'}
          onClick={() => setTab('water')}
          label="Water"
          count={water.length}
          alert={behind}
        />
        <SegButton active={tab === 'food'} onClick={() => setTab('food')} label="Food" count={food.length} />
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {tab === 'drink' && (
          <DrinkPanel
            drinks={drinks}
            now={now}
            onAdd={onAddDrink}
            onRemove={onRemoveDrink}
          />
        )}
        {tab === 'water' && (
          <WaterPanel
            glasses={water.length}
            drinks={drinks.length}
            behind={behind}
            water={water}
            now={now}
            onAdd={onAddWater}
            onRemove={onRemoveWater}
          />
        )}
        {tab === 'food' && (
          <FoodPanel
            entries={food}
            now={now}
            onAdd={onAddFood}
            onRemove={onRemoveFood}
          />
        )}
      </motion.div>
    </Sheet>
  );
}

function SegButton({
  active,
  onClick,
  label,
  count,
  alert,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  alert?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative h-10 rounded-full flex items-center justify-center gap-1.5 font-display text-[15px] transition-all min-tap',
        active
          ? 'bg-bg-card text-ink shadow-press'
          : 'text-ink-muted hover:text-ink',
      )}
    >
      <span className={active ? 'hb-italic' : ''}>{label}</span>
      <span
        className={cn(
          'font-mono text-[10px] tabular-nums tracking-tight',
          active ? 'text-ink-muted' : 'text-ink-dim',
        )}
      >
        {count}
      </span>
      {alert && !active && (
        <span className="absolute top-1.5 right-3 h-1.5 w-1.5 rounded-full bg-risk-yellow" />
      )}
    </button>
  );
}
