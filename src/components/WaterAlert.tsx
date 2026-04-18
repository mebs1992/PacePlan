import { motion } from 'framer-motion';
import { Droplet } from 'lucide-react';

type Props = {
  deficit: number;
  onAdd: () => void;
};

export function WaterAlert({ deficit, onAdd }: Props) {
  if (deficit <= 0) return null;
  return (
    <motion.button
      type="button"
      onClick={onAdd}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-accent/20 border border-cyan-300/40 shadow-[0_0_30px_-8px_rgba(34,211,238,0.6)] animate-breathe"
    >
      <div className="shrink-0 h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
        <Droplet className="h-6 w-6 text-cyan-200" />
      </div>
      <div className="text-left flex-1">
        <div className="text-sm font-extrabold tracking-wide text-ink">DRINK WATER</div>
        <div className="text-xs text-ink-muted mt-0.5">
          You're {deficit} {deficit === 1 ? 'glass' : 'glasses'} behind. Tap to log one now.
        </div>
      </div>
      <div className="text-[11px] text-ink font-semibold px-2 py-1 rounded-lg bg-white/10 border border-white/10">
        +1
      </div>
    </motion.button>
  );
}
