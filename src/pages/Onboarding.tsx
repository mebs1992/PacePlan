import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { useProfile } from '@/store/useProfile';
import { cn } from '@/lib/utils';
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
      <header className="text-center my-6">
        <h1 className="text-3xl font-bold text-ink">Hangover Buddy</h1>
        <p className="text-ink-muted text-sm mt-1">
          Pace your drinks. Skip the hangover.
        </p>
      </header>

      <Card className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-ink-muted">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="given-name"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider text-ink-muted">
            Biological sex
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(['male', 'female'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSex(opt)}
                className={cn(
                  'h-12 rounded-xl bg-bg-elev text-ink font-medium capitalize min-tap',
                  sex === opt && 'ring-2 ring-accent bg-accent/10'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-ink-dim mt-1">
            Used for the Widmark BAC formula (r=0.68 male, 0.55 female).
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-muted">Age</label>
            <Input
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-muted">
              Height
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="cm"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-ink-muted">
              Weight
            </label>
            <Input
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="kg"
              className="mt-1"
            />
          </div>
        </div>

        {error && <div className="text-risk-red text-sm">{error}</div>}

        <Button className="w-full" size="lg" onClick={attemptSubmit}>
          Get started
        </Button>
      </Card>

      <p className="text-[11px] text-ink-dim text-center mt-4">
        Data stays on this device. No account, no tracking.
      </p>

      {showDisclaimer && <DisclaimerModal onAccept={finalize} />}
    </div>
  );
}
