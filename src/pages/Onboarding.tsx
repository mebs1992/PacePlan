import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { useProfile } from '@/store/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import type { Sex } from '@/types';

const TOTAL_STEPS = 4;

export function Onboarding() {
  const setProfile = useProfile((s) => s.setProfile);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [age, setAge] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function next() {
    setError(null);
    if (step === 1) {
      if (!name.trim()) return setError('We need something to call you.');
      setStep(2);
      return;
    }
    if (step === 2) {
      if (sex === null) return setError('Pick one — it changes the math.');
      setStep(3);
      return;
    }
    if (step === 3) {
      const ageN = parseInt(age, 10);
      const heightN = parseFloat(heightCm);
      const weightN = parseFloat(weightKg);
      if (!Number.isFinite(ageN) || ageN < 18) return setError('You must be 18 or older.');
      if (!Number.isFinite(heightN) || heightN < 100 || heightN > 250)
        return setError('Enter height in cm (100–250).');
      if (!Number.isFinite(weightN) || weightN < 35 || weightN > 250)
        return setError('Enter weight in kg (35–250).');
      setStep(4);
      return;
    }
    if (step === 4) {
      setShowDisclaimer(true);
    }
  }

  function back() {
    setError(null);
    if (step > 1) setStep(step - 1);
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
    <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28 min-h-screen flex flex-col">
      <ProgressHeader step={step} total={TOTAL_STEPS} onBack={step > 1 ? back : undefined} />

      <div className="flex-1 mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Step
                eyebrow="INTRODUCTIONS"
                title={
                  <>
                    What should we <em className="hb-italic">call you</em> tomorrow at 9 a.m.?
                  </>
                }
              >
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  autoComplete="given-name"
                  className="h-14 text-lg"
                  autoFocus
                />
              </Step>
            )}

            {step === 2 && (
              <Step
                eyebrow="BIOLOGY"
                title={
                  <>
                    Which <em className="hb-italic">ratio</em> should we use?
                  </>
                }
                caption="The Widmark constant: 0.68 for males, 0.55 for females."
              >
                <div className="grid grid-cols-2 gap-3">
                  {(['male', 'female'] as const).map((opt) => (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSex(opt)}
                      className={`h-16 rounded-2xl font-display text-[18px] capitalize min-tap transition-all border ${
                        sex === opt
                          ? 'bg-accent text-white border-accent shadow-fab'
                          : 'bg-bg-elev border-line text-ink hover:bg-bg-card'
                      }`}
                    >
                      {opt}
                      <div
                        className={`font-mono text-[10px] tracking-widest mt-0.5 ${
                          sex === opt ? 'text-white/80' : 'text-ink-dim'
                        }`}
                      >
                        r = {opt === 'male' ? '0.68' : '0.55'}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step
                eyebrow="NUMBERS"
                title={
                  <>
                    The <em className="hb-italic">specifics</em>, so the maths works.
                  </>
                }
                caption="Age, height and weight feed the BAC formula."
              >
                <div className="space-y-4">
                  <Field label="Age">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      className="h-14 text-lg"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Height (cm)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="180"
                        className="h-14 text-lg"
                      />
                    </Field>
                    <Field label="Weight (kg)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        placeholder="78"
                        className="h-14 text-lg"
                      />
                    </Field>
                  </div>
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step
                eyebrow="ONE LAST THING"
                title={
                  <>
                    A note on <em className="hb-italic">honesty</em>.
                  </>
                }
                caption="Estimates only. Never use BAC to decide whether to drive."
              >
                <div className="rounded-2xl border border-line bg-bg-card p-5 space-y-3">
                  <Summary label="Name" value={name.trim()} />
                  <Summary label="Sex" value={sex ?? ''} />
                  <Summary label="Age" value={`${age}y`} />
                  <Summary label="Height" value={`${heightCm} cm`} />
                  <Summary label="Weight" value={`${weightKg} kg`} />
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-risk-red text-sm font-medium mt-4"
          >
            {error}
          </motion.div>
        )}
      </div>

      <div className="mt-8">
        <Button className="w-full" size="lg" onClick={next}>
          {step < TOTAL_STEPS ? 'Continue' : 'Review disclaimer'}
        </Button>
        <p className="font-mono text-[10px] text-ink-dim text-center mt-4 tracking-wider">
          DATA STAYS ON THIS DEVICE. NO ACCOUNT, NO TRACKING.
        </p>
      </div>

      {showDisclaimer && <DisclaimerModal onAccept={finalize} />}
    </div>
  );
}

function ProgressHeader({
  step,
  total,
  onBack,
}: {
  step: number;
  total: number;
  onBack?: () => void;
}) {
  const pct = (step / total) * 100;
  return (
    <div className="flex items-start justify-between gap-4 pt-2">
      <button
        onClick={onBack}
        disabled={!onBack}
        className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-muted disabled:text-ink-dim disabled:cursor-default hover:text-ink transition"
      >
        <span className="block leading-tight">
          {String(step).padStart(2, '0')} /
        </span>
        <span className="block leading-tight underline decoration-accent underline-offset-[6px] decoration-[1.5px]">
          {String(total).padStart(2, '0')}
        </span>
      </button>
      <div className="flex-1 h-px bg-line relative mt-3">
        <motion.div
          className="absolute left-0 top-0 h-full bg-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        />
      </div>
      <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted text-right leading-tight">
        HANGOVER
        <br />
        BUDDY
      </div>
    </div>
  );
}

function Step({
  eyebrow,
  title,
  caption,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="eyebrow">{eyebrow}</div>
      <h1 className="font-display text-[34px] leading-[1.1] tracking-[-0.02em] text-ink mt-3 mb-2">
        {title}
      </h1>
      {caption && (
        <p className="text-[14px] text-ink-muted leading-snug mb-6">{caption}</p>
      )}
      {!caption && <div className="mb-6" />}
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="eyebrow">{label}</span>
      <span className="font-display text-[16px] text-ink capitalize">{value}</span>
    </div>
  );
}
