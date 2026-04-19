import { motion } from 'framer-motion';

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
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full flex items-center gap-3 rounded-[16px] border border-line bg-bg-card px-4 py-3 hover:bg-bg-elev transition text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="eyebrow">HYDRATION</div>
        <div className="font-display text-[18px] leading-[1.15] text-ink mt-0.5">
          Drink water.{' '}
          <span className="hb-italic text-risk-yellow">
            {deficit} {deficit === 1 ? 'glass' : 'glasses'} behind.
          </span>
        </div>
      </div>
      <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-accent shrink-0 px-3 py-1.5 rounded-full border border-line-2">
        +1
      </div>
    </motion.button>
  );
}
