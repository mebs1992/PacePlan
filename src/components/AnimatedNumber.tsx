import { useEffect } from 'react';
import { animate, useMotionValue, useTransform, motion } from 'framer-motion';

type Props = {
  value: number;
  decimals?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
};

export function AnimatedNumber({ value, decimals = 3, className, prefix = '', suffix = '' }: Props) {
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.6,
      ease: [0.32, 0.72, 0, 1],
    });
    return controls.stop;
  }, [value, mv]);

  return <motion.span className={className}>{display}</motion.span>;
}
