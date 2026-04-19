import { Sheet } from '@/components/ui/Sheet';
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
      <div>
        <div className="eyebrow">LAST CALL</div>
        <h2 className="font-display text-[30px] leading-[1.02] tracking-[-0.02em] text-ink mt-1.5">
          End the <span className="hb-italic text-accent">evening?</span>
        </h2>
        <p className="font-display italic text-[14px] text-ink-muted mt-2 leading-snug">
          We&rsquo;ll check in with you in the morning. No judgement, mostly.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-5">
        <Stat label="RAN" value={formatDuration(duration)} />
        <Stat label="DRINKS" value={String(drinks)} />
        <Stat label="PEAK BAC" value={peak.toFixed(3)} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5">
        <button
          type="button"
          onClick={onClose}
          className="h-12 rounded-full border border-line bg-bg-card text-ink font-display text-[15px] hover:bg-bg-elev transition min-tap"
        >
          Keep going
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="h-12 rounded-full bg-ink text-bg-card font-display italic text-[16px] hover:brightness-110 active:brightness-95 transition min-tap"
        >
          End session
        </button>
      </div>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-line bg-bg-elev px-3 py-3">
      <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-dim">
        {label}
      </div>
      <div className="font-display tabular-nums text-[22px] text-ink leading-none mt-1.5">
        {value}
      </div>
    </div>
  );
}
