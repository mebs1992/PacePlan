import { motion } from 'framer-motion';
import { Utensils, Droplets, Timer, MoonStar } from 'lucide-react';
import type { NightPlan } from '@/lib/plan';
import { formatClockWithDay } from '@/lib/time';

function clockLabel(ms: number, now: number): string {
  return formatClockWithDay(ms, now);
}

export function PlanCard({ plan, now }: { plan: NightPlan; now: number }) {
  const mealByMs = now + 30 * 60_000;
  const drinksText = plan.drinksCap > 0
    ? `${plan.drinksCap} drink${plan.drinksCap === 1 ? '' : 's'}`
    : 'skip a round';
  const paceText = plan.minutesPerDrink
    ? `one every ~${plan.minutesPerDrink}m`
    : '—';
  const waterGlasses = Math.max(2, plan.drinksCap);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mt-4 rounded-[20px] border border-line bg-bg-card p-5"
    >
      <div className="flex items-baseline justify-between">
        <div className="eyebrow">THE PLAN</div>
        <div className="font-mono text-[10px] text-ink-dim tracking-tight">
          target &lt; {plan.peakCap.toFixed(3)}{plan.driving ? ' · driving' : ''}
        </div>
      </div>
      <h2 className="font-display text-[24px] leading-tight text-ink mt-2">
        <span className="hb-italic">Before</span> you start.
      </h2>

      <ul className="mt-4 space-y-3">
        <PlanRow
          icon={<Utensils className="h-4 w-4 text-ink-muted" />}
          title="Eat a full meal"
          detail={`by ~${clockLabel(mealByMs, now)} · slows absorption`}
        />
        <PlanRow
          icon={<Droplets className="h-4 w-4 text-ink-muted" />}
          title="500ml water now"
          detail={`then ${waterGlasses} glasses through the night`}
        />
        <PlanRow
          icon={<Timer className="h-4 w-4 text-ink-muted" />}
          title={`Pace: ${drinksText}`}
          detail={`${paceText} · stays under ${plan.peakCap.toFixed(3)}`}
        />
        {plan.lastCallMs !== null && (
          <PlanRow
            icon={<MoonStar className="h-4 w-4 text-ink-muted" />}
            title={`Last call ~${clockLabel(plan.lastCallMs, now)}`}
            detail="gives you time to clear before waking"
          />
        )}
      </ul>

      {plan.drinksCap === 0 && (
        <p className="font-mono text-[11px] text-risk-red mt-4 leading-relaxed tracking-tight">
          At this pace a single drink would push you over the cap. Extend the
          session, add a meal, or make tonight dry.
        </p>
      )}
    </motion.div>
  );
}

function PlanRow({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full border border-line bg-bg-elev flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="font-display text-[15px] text-ink leading-tight">
          {title}
        </div>
        <div className="font-mono text-[11px] text-ink-dim mt-0.5 tracking-tight leading-snug">
          {detail}
        </div>
      </div>
    </li>
  );
}
