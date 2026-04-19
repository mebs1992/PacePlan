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
      className="w-full relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 bg-sky-50 border border-sky-200 animate-breathe"
    >
      <div className="shrink-0 h-11 w-11 rounded-xl bg-sky-500 text-white flex items-center justify-center">
        <Droplet className="h-5 w-5" />
      </div>
      <div className="text-left flex-1">
        <div className="text-sm font-bold tracking-tight text-sky-900">Drink water</div>
        <div className="text-xs text-sky-800/70 mt-0.5">
          You're {deficit} {deficit === 1 ? 'glass' : 'glasses'} behind. Tap to log one now.
        </div>
      </div>
      <div className="text-xs text-sky-900 font-bold px-2.5 py-1 rounded-lg bg-white border border-sky-200">
        +1
      </div>
    </motion.button>
  );
}
