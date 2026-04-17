import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { useProfile } from '@/store/useProfile';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Sex } from '@/types';

export function Onboarding() {
  const setProfile = useProfile((s) => s.setProfile);

  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function attemptSubmit() {
    setError(null);
    const ageN = parseInt(age, 10);
    const heightN = parseFloat(heightCm);
    const weightN = parseFloat(weightKg);
    if (!name.trim()) return setError('Please enter your name.');
    if (sex === null) return setError('Please select biological sex.');
    if (!Number.isFinite(ageN) || ageN < 18) return setError('You must be 18 or older.');
    if (!Number.isFinite(heightN) || heightN < 100 || heightN > 250)
      return setError('Enter height in cm (100–250).');
    if (!Number.isFinite(weightN) || weightN < 35 || weightN > 250)
      return setError('Enter weight in kg (35–250).');
    setShowDisclaimer(true);
  }

  function finalize() {
    setProfile({
      name: name.trim(),
      sex: sex!,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      age: parseInt(age, 10),
      acceptedDisclaimerAt: Date.now(),
    });
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center my-10"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-ink-muted mb-4">
          <Sparkles className="h-3 w-3 text-accent" />
          mobile · offline · private
        </div>
        <h1 className="text-5xl font-bold tracking-tight gradient-text">
          Hangover Buddy
        </h1>
        <p className="text-ink-muted text-sm mt-3 max-w-xs mx-auto">
          Pace your drinks with live BAC tracking. Skip the morning regret.
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="given-name"
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Biological sex
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(['male', 'female'] as const).map((opt) => (
                <motion.button
                  key={opt}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSex(opt)}
                  className={`relative h-12 rounded-xl font-medium capitalize min-tap transition-all overflow-hidden ${
                    sex === opt
                      ? 'bg-gradient-to-br from-accent/30 to-accent-violet/30 border border-accent/50 text-ink shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]'
                      : 'bg-white/5 border border-white/10 text-ink-muted'
                  }`}
                >
                  {opt}
                </motion.button>
              ))}
            </div>
            <p className="text-[11px] text-ink-dim mt-1.5">
              Used in the Widmark BAC formula (r=0.68 male, 0.55 female).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Age
              </label>
              <Input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Height
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="cm"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                Weight
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="kg"
                className="mt-1.5"
              />
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-risk-red text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button className="w-full" size="lg" onClick={attemptSubmit}>
            Get started →
          </Button>
        </Card>
      </motion.div>

      <p className="text-[11px] text-ink-dim text-center mt-4">
        Data stays on this device. No account, no tracking.
      </p>

      {showDisclaimer && <DisclaimerModal onAccept={finalize} />}
    </div>
  );
}
