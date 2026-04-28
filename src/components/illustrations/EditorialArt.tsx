import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type ArtProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  title?: string;
};

export const visualAssets = {
  mountainNight: '/visuals/bg_mountain_night.png',
  mountainDusk: '/visuals/bg_mountain_dusk.png',
  heroLow: '/visuals/hero_low.png',
  heroMid: '/visuals/hero_mid.png',
  heroHigh: '/visuals/hero_high.png',
  waveGraph: '/visuals/graph_wave.png',
  bacCurve: '/visuals/graph_bac_curve.png',
  hydration: '/visuals/illustration_hydration.png',
  sleep: '/visuals/illustration_sleep.png',
  celebration: '/visuals/illustration_celebration.png',
  waterGlass: '/visuals/water_glass.png',
  foodBowl: '/visuals/food_bowl.png',
  sleepIllust: '/visuals/sleep_illust.png',
  glowPath: '/visuals/glow_path.png',
  particles: '/visuals/particles.png',
} as const;

function VisualImage({
  src,
  title,
  className,
  ...props
}: ArtProps & { src: string }) {
  return (
    <img
      src={src}
      alt={title}
      className={cn('h-full w-full object-cover', className)}
      draggable={false}
      loading="lazy"
      {...props}
    />
  );
}

export function MountainNightArt({
  title = 'Mountain valley at night',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.mountainNight} title={title} {...props} />;
}

export function MountainDuskArt({
  title = 'Mountain valley at dusk',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.mountainDusk} title={title} {...props} />;
}

export function WaveGraphArt({
  title = 'Recommendation wave graph',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.waveGraph} title={title} {...props} />;
}

export function BacCurveArt({
  title = 'BAC curve safe zone',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.bacCurve} title={title} {...props} />;
}

export function HydrationArt({
  title = 'Glass of water',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.hydration} title={title} {...props} />;
}

export function SleepArt({
  title = 'Crescent moon over night sky',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.sleep} title={title} {...props} />;
}

export function CelebrationArt({
  title = 'Subtle night celebration',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.celebration} title={title} {...props} />;
}

export function HeroStateArt({
  state,
  title = 'Night valley progress',
  ...props
}: ArtProps & { state: 'low' | 'mid' | 'high' }) {
  const src =
    state === 'high'
      ? visualAssets.heroHigh
      : state === 'mid'
        ? visualAssets.heroMid
        : visualAssets.heroLow;
  return <VisualImage src={src} title={title} {...props} />;
}

export function WaterGlassArt({
  title = 'Glass of water',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.waterGlass} title={title} {...props} />;
}

export function FoodBowlArt({
  title = 'Meal bowl',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.foodBowl} title={title} {...props} />;
}

export function SleepIllustArt({
  title = 'Crescent moon landscape',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.sleepIllust} title={title} {...props} />;
}

export function GlowPathArt({
  title = 'Glowing path',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.glowPath} title={title} {...props} />;
}

export function ParticlesArt({
  title = 'Soft glow particles',
  ...props
}: ArtProps) {
  return <VisualImage src={visualAssets.particles} title={title} {...props} />;
}

// Backward-compatible names used by existing screens.
export function LandscapeArt(props: ArtProps) {
  return <MountainNightArt {...props} />;
}

export function ChecklistStillLifeArt(props: ArtProps) {
  return <BacCurveArt {...props} />;
}

export function GlassStillLifeArt(props: ArtProps) {
  return <HydrationArt {...props} />;
}

export function TrendSparkArt(props: ArtProps) {
  return <WaveGraphArt {...props} />;
}
