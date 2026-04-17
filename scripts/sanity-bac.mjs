import { computeBacAt, recommendCutoff } from '../src/lib/bac.ts';

const profile = {
  name: 'Test',
  sex: 'male',
  heightCm: 180,
  weightKg: 70,
  age: 30,
  acceptedDisclaimerAt: 0,
};

const t0 = 0;
const HOUR = 60 * 60 * 1000;
const drinks = Array.from({ length: 4 }, (_, i) => ({
  id: `d${i}`,
  type: 'mid_beer',
  label: 'Beer',
  standardDrinks: 1.0,
  at: t0,
}));

const food = [];

const cases = [
  { label: 'Right after drinking (peak ~ 0.079%)', at: t0 + 25 * 60 * 1000 },
  { label: 'After 1 hour (~ 0.069%)', at: t0 + 1 * HOUR },
  { label: 'After 2 hours (~ 0.054%)', at: t0 + 2 * HOUR },
  { label: 'After 5 hours (should be near 0)', at: t0 + 5 * HOUR },
];

console.log('70 kg male, 4 std drinks at t=0, empty stomach:');
for (const c of cases) {
  const bac = computeBacAt({ profile, drinks, food, at: c.at });
  console.log(`  ${c.label}: ${(bac * 100).toFixed(3)}/100% BAC`);
}

const cutoff = recommendCutoff(
  { profile, drinks: [], food, at: t0 },
  t0 + 5 * HOUR
);
console.log('\nCut-off for 5h session, no drinks yet:');
console.log(' ', cutoff);
