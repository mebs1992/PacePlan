import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { DrinkPanel } from '@/components/panels/DrinkPanel';
import { WaterPanel } from '@/components/panels/WaterPanel';
import { FoodPanel } from '@/components/panels/FoodPanel';
import { Beer, Droplet, UtensilsCrossed } from 'lucide-react';
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
      <div className="relative bg-bg-elev rounded-2xl p-1 flex border border-line mb-4">
        <TabButton
          active={tab === 'drink'}
          onClick={() => setTab('drink')}
          icon={<Beer className="h-4 w-4" />}
          label="Drink"
          count={drinks.length}
        />
        <TabButton
          active={tab === 'water'}
          onClick={() => setTab('water')}
          icon={<Droplet className="h-4 w-4" />}
          label="Water"
          count={water.length}
          alert={behind}
        />
        <TabButton
          active={tab === 'food'}
          onClick={() => setTab('food')}
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label="Food"
          count={food.length}
        />
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

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  alert,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  alert?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex-1 min-tap h-11 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold transition-all',
        active ? 'bg-bg-card text-ink shadow-press' : 'text-ink-muted',
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          'text-[11px] tabular-nums font-semibold',
          active ? 'text-ink-muted' : 'text-ink-dim',
        )}
      >
        {count}
      </span>
      {alert && !active && (
        <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-risk-yellow" />
      )}
    </button>
  );
}
