import { Sheet } from '@/components/ui/Sheet';
import { DrinkPicker } from '@/components/DrinkPicker';
import { DrinkList } from '@/components/DrinkList';
import type { DrinkEntry, DrinkType } from '@/types';

type Props = {
  open: boolean;
  onClose: () => void;
  drinks: DrinkEntry[];
  now: number;
  onAdd: (input: { type: DrinkType; label: string; standardDrinks: number }) => void;
  onRemove: (id: string) => void;
};

export function DrinkSheet({ open, onClose, drinks, now, onAdd, onRemove }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Log a drink">
      <DrinkPicker onAdd={onAdd} />
      <div className="mt-6">
        <DrinkList drinks={drinks} now={now} onRemove={onRemove} />
      </div>
    </Sheet>
  );
}
