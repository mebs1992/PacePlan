import { DrinkPicker } from '@/components/DrinkPicker';
import { DrinkList } from '@/components/DrinkList';
import type { DrinkEntry, DrinkType } from '@/types';

type Props = {
  drinks: DrinkEntry[];
  now: number;
  onAdd: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
  onRemove: (id: string) => void;
};

export function DrinkPanel({ drinks, now, onAdd, onRemove }: Props) {
  return (
    <div>
      <DrinkPicker onAdd={onAdd} />
      <div className="mt-6">
        <DrinkList drinks={drinks} now={now} onRemove={onRemove} />
      </div>
    </div>
  );
}
