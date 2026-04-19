import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Moon } from 'lucide-react';
import { formatDuration } from '@/lib/time';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  duration: number;
  drinks: number;
  peak: number;
};

export function ConfirmEndSheet({
  open,
  onClose,
  onConfirm,
  duration,
  drinks,
  peak,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="text-center pb-4 pt-1">
        <div className="mx-auto h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center mb-3">
          <Moon className="h-7 w-7 text-accent" />
        </div>
        <h2 className="text-xl font-bold text-ink tracking-tight">Wrap up the night?</h2>
        <p className="text-sm text-ink-muted mt-1.5 leading-relaxed">
          We'll save tonight to your history and check in with a recap tomorrow morning.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-bg-elev border border-line p-3 text-center">
        <Stat label="Duration" value={formatDuration(duration)} />
        <Stat label="Drinks" value={String(drinks)} />
        <Stat label="Peak BAC" value={`${peak.toFixed(3)}%`} />
      </div>

      <div className="mt-5 space-y-2">
        <Button className="w-full" size="lg" onClick={onConfirm}>
          End session
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 text-sm font-semibold text-ink-muted hover:text-ink transition"
        >
          Keep going
        </button>
      </div>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
        {label}
      </div>
      <div className="text-sm font-bold text-ink tabular-nums tracking-tight mt-1">
        {value}
      </div>
    </div>
  );
}
