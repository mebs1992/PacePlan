import { motion } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';

type Tone = 'coral' | 'sky' | 'amber';

type Props = {
  tone: Tone;
  icon: LucideIcon;
  label: string;
  count: number;
  caption: string;
  alert?: boolean;
  onClick: () => void;
};

const TONES: Record<Tone, { bg: string; iconBg: string; iconColor: string; countColor: string }> = {
  coral: {
    bg: 'bg-bg-card border-line',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    countColor: 'text-accent',
  },
  sky: {
    bg: 'bg-bg-card border-line',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    countColor: 'text-sky-600',
  },
  amber: {
    bg: 'bg-bg-card border-line',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    countColor: 'text-amber-700',
  },
};

export function ActionTile({ tone, icon: Icon, label, count, caption, alert, onClick }: Props) {
  const t = TONES[tone];
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group w-full flex items-center gap-3 p-3.5 rounded-2xl border shadow-card ${t.bg} min-tap transition hover:shadow-card-lg active:bg-bg-elev`}
    >
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${t.iconBg} ${alert ? 'animate-breathe' : ''}`}>
        <Icon className={`h-6 w-6 ${t.iconColor}`} strokeWidth={2} />
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="text-base font-bold text-ink tracking-tight leading-tight">{label}</div>
        <div className="text-xs text-ink-muted mt-0.5 truncate">{caption}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-2xl font-bold tabular-nums tracking-tight ${t.countColor}`}>
          {count}
        </span>
        <ChevronRight className="h-5 w-5 text-ink-dim" />
      </div>
    </motion.button>
  );
}
