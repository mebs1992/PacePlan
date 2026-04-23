import { useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import {
  buildBaselineModel,
  hydrationHabitLabel,
  morningFeelLabel,
  sleepQualityLabel,
  typicalDrinksLabel,
} from '@/lib/baseline';
import { useProfile } from '@/store/useProfile';
import type {
  DrinkingFrequency,
  HydrationHabit,
  MorningFeel,
  PersonalBaseline,
  Sex,
  SleepQuality,
  TypicalDrinksBand,
} from '@/types';

const TOTAL_STEPS = 7;

export function Onboarding() {
  const setProfile = useProfile((s) => s.setProfile);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [weightKg, setWeightKg] = useState('');
  const [frequency, setFrequency] = useState<DrinkingFrequency | null>(null);
  const [typicalDrinks, setTypicalDrinks] = useState<TypicalDrinksBand | null>(null);
  const [morningFeel, setMorningFeel] = useState<MorningFeel | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [hydrationHabit, setHydrationHabit] = useState<HydrationHabit | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baselineDraft: PersonalBaseline | null =
    frequency && typicalDrinks && morningFeel && sleepQuality && hydrationHabit
      ? {
          frequency,
          typicalDrinks,
          morningFeel,
          sleepQuality,
          hydrationHabit,
          completedAt: Date.now(),
        }
      : null;

  const preview = useMemo(
    () => buildBaselineModel(baselineDraft),
    [baselineDraft],
  );

  function next() {
    setError(null);

    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      const weightN = parseFloat(weightKg);
      if (!name.trim()) return setError('We need something to call you.');
      if (sex === null) return setError('Pick one — it changes the math.');
      if (!Number.isFinite(weightN) || weightN < 35 || weightN > 250) {
        return setError('Enter weight in kg (35–250).');
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!frequency || !typicalDrinks) {
        return setError('Pick both your usual rhythm and your typical night.');
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      if (!morningFeel) return setError('Pick the option that feels most like you.');
      setStep(5);
      return;
    }

    if (step === 5) {
      if (!sleepQuality || !hydrationHabit) {
        return setError('Set both your sleep and water habits.');
      }
      setStep(6);
      return;
    }

    if (step === 6) {
      setStep(7);
      return;
    }

    if (step === 7) {
      setShowDisclaimer(true);
    }
  }

  function back() {
    setError(null);
    if (step > 1) setStep(step - 1);
  }

  function finalize() {
    const completedAt = Date.now();
    setProfile({
      name: name.trim(),
      sex: sex!,
      weightKg: parseFloat(weightKg),
      acceptedDisclaimerAt: completedAt,
      baseline: {
        frequency: frequency!,
        typicalDrinks: typicalDrinks!,
        morningFeel: morningFeel!,
        sleepQuality: sleepQuality!,
        hydrationHabit: hydrationHabit!,
        completedAt,
      },
    });
  }

  const resultLabel = preview ? verdictLabel(preview.readinessScore) : 'Starting read';
  const firstName = name.trim() || 'you';

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
                eyebrow="PACEPLAN"
                title={
                  <>
                    Not all nights <em className="hb-italic">hit the same</em>.
                  </>
                }
                caption="We’ll give you a starting read for tonight, then sharpen it fast once the app sees real days."
              >
                <div className="rounded-[28px] border border-line bg-bg-card p-5 space-y-3">
                  <HookRow label="Day-one verdict" value="Low risk / Moderate risk / Not worth it" />
                  <HookRow label="Easy-morning line" value="A drinks target that feels personal" />
                  <HookRow label="Gets sharper" value="Sleep, water, and real sessions take over" />
                </div>
              </Step>
            )}

            {step === 2 && (
              <Step
                eyebrow="ABOUT YOU"
                title={
                  <>
                    Enough to make the <em className="hb-italic">math fit</em>.
                  </>
                }
                caption="This is the body data the planner actually uses."
              >
                <div className="space-y-4">
                  <Field label="Name">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Marcus"
                      autoComplete="given-name"
                      className="h-14 text-lg"
                      autoFocus
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    {(['male', 'female'] as const).map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={sex === option}
                        onClick={() => setSex(option)}
                        label={option}
                        sub={option === 'male' ? 'r = 0.68' : 'r = 0.55'}
                        compact
                      />
                    ))}
                  </div>

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
              </Step>
            )}

            {step === 3 && (
              <Step
                eyebrow="YOUR PATTERN"
                title={
                  <>
                    How do nights <em className="hb-italic">usually go</em>?
                  </>
                }
              >
                <QuestionBlock
                  label="How often do you drink?"
                  note={frequency ? frequencyResponse(frequency) : 'This sets your starting recovery load.'}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        selected={frequency === option.value}
                        onClick={() => setFrequency(option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </QuestionBlock>

                <QuestionBlock
                  label="On a typical night, how many drinks?"
                  note={
                    typicalDrinks
                      ? typicalDrinksResponse(typicalDrinks)
                      : 'This sets your starting easy-morning line.'
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    {TYPICAL_DRINK_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        selected={typicalDrinks === option.value}
                        onClick={() => setTypicalDrinks(option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </QuestionBlock>
              </Step>
            )}

            {step === 4 && (
              <Step
                eyebrow="THE NEXT MORNING"
                title={
                  <>
                    How do you usually <em className="hb-italic">feel after</em>?
                  </>
                }
                caption="This matters most because it changes how harsh or forgiving the forecast should be."
              >
                <div className="space-y-3">
                  {MORNING_FEEL_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={morningFeel === option.value}
                      onClick={() => setMorningFeel(option.value)}
                      label={option.label}
                      sub={option.sub}
                    />
                  ))}
                </div>

                <ResponseNote className="mt-4">
                  {morningFeel
                    ? morningFeelResponse(morningFeel)
                    : 'Pick the one that feels closest. This is what makes the read feel personal instead of generic.'}
                </ResponseNote>
              </Step>
            )}

            {step === 5 && (
              <Step
                eyebrow="DAILY HABITS"
                title={
                  <>
                    What shapes the <em className="hb-italic">starting read</em>?
                  </>
                }
              >
                <QuestionBlock
                  label="How’s your sleep lately?"
                  note={
                    sleepQuality
                      ? sleepResponse(sleepQuality)
                      : 'Sleep moves the score more than most people expect.'
                  }
                >
                  <div className="space-y-3">
                    {SLEEP_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        selected={sleepQuality === option.value}
                        onClick={() => setSleepQuality(option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </QuestionBlock>

                <QuestionBlock
                  label="How much water do you usually drink?"
                  note={
                    hydrationHabit
                      ? hydrationResponse(hydrationHabit)
                      : 'Hydration helps set the day-one read before you log anything.'
                  }
                >
                  <div className="grid grid-cols-2 gap-3">
                    {HYDRATION_OPTIONS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        selected={hydrationHabit === option.value}
                        onClick={() => setHydrationHabit(option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                </QuestionBlock>
              </Step>
            )}

            {step === 6 && preview && (
              <Step
                eyebrow="YOUR STARTING READ"
                title={
                  <>
                    Here’s the <em className="hb-italic">baseline</em>.
                  </>
                }
                caption="This is a starting estimate. Real sleep, water, and session history take over quickly."
              >
                <div className="rounded-[30px] border border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,227,210,0.9)_48%,rgba(255,255,255,0.86)_100%)] p-5">
                  <div className="eyebrow">TONIGHT</div>
                  <div className="font-display text-[34px] leading-[1.02] tracking-[-0.03em] text-ink mt-2">
                    {resultLabel}
                  </div>
                  <div className="font-display italic text-[16px] text-ink-muted mt-3 leading-snug">
                    {firstName} usually feels {morningFeelLabel(morningFeel!)} after drinking.
                  </div>

                  <div className="rounded-[22px] border border-line bg-white/84 px-4 py-4 mt-5">
                    <div className="eyebrow">EASY-MORNING LINE</div>
                    <div className="font-display text-[26px] leading-tight text-ink mt-2">
                      Start around {preview.easyMorningLine} drinks
                    </div>
                    <div className="font-display italic text-[14px] leading-snug text-ink-muted mt-2">
                      Biggest movers for you: {preview.topFactors[0]} + {preview.topFactors[1]}.
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <MiniStat label="Starting read" value={`${preview.readinessScore}/100`} />
                    <MiniStat label="Typical night" value={typicalDrinksLabel(typicalDrinks!)} />
                    <MiniStat label="Sleep" value={sleepQualityLabel(sleepQuality!)} />
                    <MiniStat label="Water" value={hydrationHabitLabel(hydrationHabit!)} />
                  </div>
                </div>
              </Step>
            )}

            {step === 7 && (
              <Step
                eyebrow="ONE LAST THING"
                title={
                  <>
                    A note on <em className="hb-italic">honesty</em>.
                  </>
                }
                caption="These are estimates only. Never use the app to decide whether to drive."
              >
                <div className="rounded-2xl border border-line bg-bg-card p-5 space-y-3">
                  <Summary label="Name" value={name.trim()} />
                  <Summary label="Sex" value={sex ?? ''} />
                  <Summary label="Weight" value={`${weightKg} kg`} />
                  <Summary label="Typical night" value={typicalDrinks ? typicalDrinksLabel(typicalDrinks) : ''} />
                  <Summary label="Morning after" value={morningFeel ? morningFeelLabel(morningFeel) : ''} />
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
          {step === 1
            ? 'Get started'
            : step < TOTAL_STEPS
              ? 'Continue'
              : 'Review disclaimer'}
        </Button>
        <p className="font-mono text-[10px] text-ink-dim text-center mt-4 tracking-wider">
          DATA STAYS ON THIS DEVICE. NO ACCOUNT, NO TRACKING.
        </p>
      </div>

      {showDisclaimer && <DisclaimerModal onAccept={finalize} />}
    </div>
  );
}

const FREQUENCY_OPTIONS: { value: DrinkingFrequency; label: string }[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'one_two_nights', label: '1–2 nights a week' },
  { value: 'three_four_nights', label: '3–4 nights a week' },
  { value: 'most_days', label: 'Most days' },
];

const TYPICAL_DRINK_OPTIONS: { value: TypicalDrinksBand; label: string }[] = [
  { value: 'two_three', label: '2–3' },
  { value: 'four_six', label: '4–6' },
  { value: 'seven_ten', label: '7–10' },
  { value: 'ten_plus', label: '10+' },
];

const MORNING_FEEL_OPTIONS: {
  value: MorningFeel;
  label: string;
  sub: string;
}[] = [
  { value: 'fine', label: 'Fine', sub: 'You usually bounce back well.' },
  { value: 'slightly_off', label: 'Slightly off', sub: 'Manageable, but not perfect.' },
  { value: 'pretty_rough', label: 'Pretty rough', sub: 'A normal night can still bite.' },
  { value: 'ruined', label: 'Ruined', sub: 'Bad mornings hit hard and fast.' },
];

const SLEEP_OPTIONS: { value: SleepQuality; label: string }[] = [
  { value: 'great', label: 'Great (7–8h)' },
  { value: 'okay', label: 'Okay' },
  { value: 'poor', label: 'Poor' },
];

const HYDRATION_OPTIONS: { value: HydrationHabit; label: string }[] = [
  { value: 'under_1l', label: '<1L' },
  { value: 'one_two_l', label: '1–2L' },
  { value: 'two_three_l', label: '2–3L' },
  { value: 'three_plus_l', label: '3L+' },
];

function verdictLabel(score: number): string {
  if (score >= 70) return 'Low Risk';
  if (score >= 45) return 'Moderate Risk';
  return 'Not Worth It';
}

function frequencyResponse(value: DrinkingFrequency): string {
  switch (value) {
    case 'rarely':
      return 'Low recent load gives you a cleaner starting buffer.';
    case 'one_two_nights':
      return 'A moderate weekly pattern gives us a balanced starting recovery load.';
    case 'three_four_nights':
      return 'That weekly load matters. Recovery starts tighter.';
    case 'most_days':
    default:
      return 'Frequent nights make recovery the first thing we watch.';
  }
}

function typicalDrinksResponse(value: TypicalDrinksBand): string {
  switch (value) {
    case 'two_three':
      return 'Lighter nights keep the easy-morning line relatively forgiving.';
    case 'four_six':
      return 'This gives us a realistic starting line without being too soft.';
    case 'seven_ten':
      return 'Heavier nights tighten the line fast if the body is not in a good spot.';
    case 'ten_plus':
    default:
      return 'This app will be most useful if it helps trim the top end of nights like this.';
  }
}

function morningFeelResponse(value: MorningFeel): string {
  switch (value) {
    case 'fine':
      return 'You recover well. The app will focus on keeping good nights good.';
    case 'slightly_off':
      return 'You are in the middle. Small changes will move the line quickly.';
    case 'pretty_rough':
      return 'That gives us room to make the forecast more protective from day one.';
    case 'ruined':
    default:
      return 'This is where a more conservative line should help the most.';
  }
}

function sleepResponse(value: SleepQuality): string {
  switch (value) {
    case 'great':
      return 'Strong sleep gives you a better day-one cushion.';
    case 'okay':
      return 'Average sleep keeps the starting read in the middle.';
    case 'poor':
    default:
      return 'Poor sleep drags the starting read down quickly.';
  }
}

function hydrationResponse(value: HydrationHabit): string {
  switch (value) {
    case 'under_1l':
      return 'Low water usually shows up tomorrow, even after the same number of drinks.';
    case 'one_two_l':
      return 'That gives us a moderate hydration baseline to start from.';
    case 'two_three_l':
      return 'Solid hydration gives you a cleaner starting edge.';
    case 'three_plus_l':
    default:
      return 'Strong hydration habits lift the starting read immediately.';
  }
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
        PACE
        <br />
        PLAN
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
  title: ReactNode;
  caption?: string;
  children: ReactNode;
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function QuestionBlock({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="eyebrow mb-2">{label}</div>
      {children}
      <ResponseNote className="mt-3">{note}</ResponseNote>
    </div>
  );
}

function ResponseNote({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[18px] border border-line bg-bg-card px-4 py-3 text-sm text-ink-muted leading-snug ${className ?? ''}`}>
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
  sub,
  compact = false,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full rounded-[22px] border text-left transition-all ${
        compact ? 'px-4 py-4' : 'px-4 py-4'
      } ${
        selected
          ? 'bg-accent text-white border-accent shadow-fab'
          : 'bg-bg-elev border-line text-ink hover:bg-bg-card'
      }`}
    >
      <div className="font-display text-[18px] leading-tight">{label}</div>
      {sub && (
        <div
          className={`font-mono text-[10px] tracking-widest mt-1 ${
            selected ? 'text-white/80' : 'text-ink-dim'
          }`}
        >
          {sub}
        </div>
      )}
    </motion.button>
  );
}

function HookRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="eyebrow">{label}</div>
      <div className="font-display text-[16px] text-ink text-right leading-snug max-w-[55%]">
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-white/84 px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
        {label}
      </div>
      <div className="font-display text-[17px] leading-snug text-ink mt-2">{value}</div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="eyebrow">{label}</span>
      <span className="font-display text-[16px] text-ink capitalize text-right">{value}</span>
    </div>
  );
}
