import { useEffect, useMemo, useState, type ReactNode, type TouchEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Droplets } from 'lucide-react';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import {
  BacCurveArt,
  ChecklistStillLifeArt,
  GlassStillLifeArt,
  MountainDuskArt,
  SleepArt,
  TrendSparkArt,
} from '@/components/illustrations/EditorialArt';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  buildBaselineModel,
  hydrationHabitLabel,
  morningFeelLabel,
  sleepQualityLabel,
  typicalDrinksLabel,
} from '@/lib/baseline';
import { cn } from '@/lib/utils';
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

const TOTAL_SETUP_STEPS = 4;
const SWIPE_THRESHOLD = 48;

type Phase = 'tour' | 'setup';

type IntroSlide = {
  id: string;
  title: string;
  body: string;
  support?: string;
  visual: 'intro' | 'plan' | 'tonight' | 'recap' | 'insights';
};

const INTRO_SLIDES: IntroSlide[] = [
  {
    id: 'intro',
    title: 'Welcome to PacePlan.',
    body: 'Smart drinking guidance built around you.',
    support: 'Plan better nights. Feel better tomorrow.',
    visual: 'intro',
  },
  {
    id: 'plan',
    title: 'Plan your night with confidence.',
    body: 'We use your sleep, water, and plans to suggest a drink limit that fits your night.',
    visual: 'plan',
  },
  {
    id: 'tonight',
    title: 'Follow your plan in the moment.',
    body: 'Simple habits and limits help you stay in your lane without overthinking it.',
    visual: 'tonight',
  },
  {
    id: 'recap',
    title: 'Log your night the next morning.',
    body: 'Tell us how it went - drinks, how you felt, and anything that stood out.',
    visual: 'recap',
  },
  {
    id: 'insights',
    title: 'Learn and improve over time.',
    body: 'We spot your patterns so every plan gets smarter and more personal.',
    visual: 'insights',
  },
];

export function Onboarding() {
  const setProfile = useProfile((s) => s.setProfile);

  const [phase, setPhase] = useState<Phase>('tour');
  const [slideIndex, setSlideIndex] = useState(0);
  const [setupStep, setSetupStep] = useState(1);

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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const baselineDraft = useMemo<PersonalBaseline | null>(() => {
    if (!frequency || !typicalDrinks || !morningFeel || !sleepQuality || !hydrationHabit) {
      return null;
    }

    return {
      frequency,
      typicalDrinks,
      morningFeel,
      sleepQuality,
      hydrationHabit,
      completedAt: Date.now(),
    };
  }, [frequency, typicalDrinks, morningFeel, sleepQuality, hydrationHabit]);

  const preview = useMemo(() => buildBaselineModel(baselineDraft), [baselineDraft]);
  const firstName = name.trim() || 'you';

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [phase, setupStep, slideIndex]);

  function beginSetup() {
    setError(null);
    setPhase('setup');
    setSetupStep(1);
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    setTouchStartX(null);

    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) {
      advanceSlide();
      return;
    }
    retreatSlide();
  }

  function advanceSlide() {
    setError(null);
    if (slideIndex === INTRO_SLIDES.length - 1) {
      beginSetup();
      return;
    }
    setSlideIndex((current) => Math.min(INTRO_SLIDES.length - 1, current + 1));
  }

  function retreatSlide() {
    setError(null);
    setSlideIndex((current) => Math.max(0, current - 1));
  }

  function nextSetupStep() {
    setError(null);

    if (setupStep === 1) {
      const weightN = parseFloat(weightKg);
      if (!name.trim()) return setError('We need something to call you.');
      if (sex === null) return setError('Pick the option that fits the estimate.');
      if (!Number.isFinite(weightN) || weightN < 35 || weightN > 250) {
        return setError('Enter weight in kg (35-250).');
      }
      setSetupStep(2);
      return;
    }

    if (setupStep === 2) {
      if (!frequency || !typicalDrinks || !morningFeel) {
        return setError('Pick the options that feel closest to your usual pattern.');
      }
      setSetupStep(3);
      return;
    }

    if (setupStep === 3) {
      if (!sleepQuality || !hydrationHabit) {
        return setError('Set both your sleep and water habits.');
      }
      setSetupStep(4);
      return;
    }

    if (setupStep === 4) {
      setShowDisclaimer(true);
    }
  }

  function previousSetupStep() {
    setError(null);
    if (setupStep > 1) setSetupStep((current) => current - 1);
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

  if (phase === 'tour') {
    const slide = INTRO_SLIDES[slideIndex];
    const lastSlide = slideIndex === INTRO_SLIDES.length - 1;

    return (
      <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18)_0%,#0F172A_52%,#111C31_100%)]">
        <div className="max-w-[480px] mx-auto h-screen overflow-hidden px-5 pt-4 pb-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="eyebrow">PACEPLAN</div>
            {!lastSlide ? (
              <button
                type="button"
                onClick={beginSetup}
                className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-muted transition hover:text-ink"
              >
                Skip
              </button>
            ) : (
              <div className="w-10" aria-hidden="true" />
            )}
          </div>

          <div className="flex-1 min-h-0 mt-3 overflow-y-auto overscroll-contain pb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="min-h-full"
              >
                <IntroSlideScreen slide={slide} index={slideIndex} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="pt-4"
            style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}
          >
            {!lastSlide ? (
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-[28px] border border-line/80 bg-bg-card/92 px-4 py-3 shadow-card">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  Swipe or tap
                </div>
                <ProgressDots total={INTRO_SLIDES.length} current={slideIndex} />
                <button
                  type="button"
                  onClick={advanceSlide}
                  className="ml-auto h-14 w-14 rounded-full border border-accent/55 bg-bg-elev text-accent shadow-card transition hover:border-accent hover:bg-bg-card flex items-center justify-center"
                  aria-label={`Next slide: ${INTRO_SLIDES[slideIndex + 1]?.title ?? 'Get started'}`}
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="rounded-[28px] border border-line/80 bg-bg-card/92 px-4 py-4 shadow-card">
                <ProgressDots total={INTRO_SLIDES.length} current={slideIndex} className="mb-5" />
                <Button className="w-full" size="lg" onClick={beginSetup}>
                  Get started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const resultLabel = preview ? verdictLabel(preview.readinessScore) : 'Starting read';

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[480px] mx-auto min-h-screen px-5 pt-6 pb-[calc(148px+env(safe-area-inset-bottom))] flex flex-col">
        <SetupHeader
          step={setupStep}
          total={TOTAL_SETUP_STEPS}
          onBack={setupStep > 1 ? previousSetupStep : undefined}
        />

        <div className="flex-1 mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={setupStep}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
            >
              {setupStep === 1 && (
                <StepShell
                  eyebrow="QUICK SETUP"
                  title={
                    <>
                      Enough detail to make the <em className="hb-italic">first plan fit</em>.
                    </>
                  }
                  caption="This is your starting baseline. Real sleep, water, and recaps take over quickly."
                >
                  <div className="space-y-4">
                    <Field label="Name">
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
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
                          label={capitalize(option)}
                          sub="Used for the estimate"
                        />
                      ))}
                    </div>

                    <Field label="Weight (kg)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={weightKg}
                        onChange={(event) => setWeightKg(event.target.value)}
                        placeholder="78"
                        className="h-14 text-lg"
                      />
                    </Field>
                  </div>
                </StepShell>
              )}

              {setupStep === 2 && (
                <StepShell
                  eyebrow="YOUR USUAL NIGHT"
                  title={
                    <>
                      Help us set a <em className="hb-italic">starting line</em>.
                    </>
                  }
                  caption="This is guidance, not a hard rule. PacePlan gets more personal once it sees real nights."
                >
                  <QuestionBlock label="How often do you drink?">
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

                  <QuestionBlock label="On a typical night, how many drinks?">
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

                  <QuestionBlock label="How do mornings usually feel after?">
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
                  </QuestionBlock>
                </StepShell>
              )}

              {setupStep === 3 && (
                <StepShell
                  eyebrow="WHAT MOVES THE LINE"
                  title={
                    <>
                      Sleep and water matter more than <em className="hb-italic">most people expect</em>.
                    </>
                  }
                  caption="These give PacePlan a better day-one read before you log tonight's real check-ins."
                >
                  <QuestionBlock label="How's your sleep lately?">
                    <div className="grid grid-cols-3 gap-2">
                      {SLEEP_OPTIONS.map((option) => (
                        <SegmentButton
                          key={option.value}
                          selected={sleepQuality === option.value}
                          onClick={() => setSleepQuality(option.value)}
                          label={option.label}
                        />
                      ))}
                    </div>
                  </QuestionBlock>

                  <QuestionBlock label="How much water do you usually drink?">
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

                  <ResponseNote>
                    Tonight's sleep and water check-ins can move this recommendation. The baseline is just the starting point.
                  </ResponseNote>
                </StepShell>
              )}

              {setupStep === 4 && preview && (
                <StepShell
                  eyebrow="YOUR STARTING READ"
                  title={
                    <>
                      A calm first plan for <em className="hb-italic">{firstName}</em>.
                    </>
                  }
                  caption="This is an estimate only. Your recommendation will stay flexible as you log real nights."
                >
                  <div className="rounded-[30px] border border-line bg-[linear-gradient(135deg,rgba(39,52,73,0.96),rgba(241,233,218,0.10)_52%,rgba(30,41,59,0.96)_100%)] p-5 shadow-card">
                    <div className="eyebrow">TONIGHT'S START</div>
                    <div className="font-display text-[34px] leading-[1.02] tracking-[-0.03em] text-ink mt-2">
                      {resultLabel}
                    </div>
                    <p className="font-display italic text-[15px] leading-snug text-ink-muted mt-3">
                      Start around {preview.easyMorningLine} drinks on an easy-morning kind of night.
                    </p>

                    <div className="rounded-[22px] border border-line bg-bg-elev/75 px-4 py-4 mt-5">
                      <div className="eyebrow">BIGGEST MOVERS</div>
                      <div className="font-display text-[24px] leading-tight text-ink mt-2">
                        {preview.topFactors[0]} + {preview.topFactors[1]}
                      </div>
                      <div className="text-sm text-ink-muted leading-snug mt-2">
                        These are what PacePlan is watching most closely in your starting baseline.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <MiniStat label="Typical night" value={typicalDrinksLabel(typicalDrinks!)} />
                      <MiniStat label="Morning after" value={morningFeelLabel(morningFeel!)} />
                      <MiniStat label="Sleep" value={sleepQualityLabel(sleepQuality!)} />
                      <MiniStat label="Water" value={hydrationHabitLabel(hydrationHabit!)} />
                    </div>
                  </div>

                  <ResponseNote className="mt-4">
                    Next up: accept the disclaimer, land on home, and get a recommendation you can use straight away.
                  </ResponseNote>
                </StepShell>
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

        <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
          <div
            className="max-w-[480px] mx-auto px-5 pt-8 pb-5 bg-gradient-to-t from-bg via-bg/95 to-bg/0 pointer-events-auto"
            style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
          >
            <Button className="w-full" size="lg" onClick={nextSetupStep}>
              {setupStep < TOTAL_SETUP_STEPS ? 'Continue' : 'Review disclaimer'}
            </Button>
            <p className="font-mono text-[10px] text-ink-dim text-center mt-4 tracking-[0.14em] uppercase">
              Data stays on this device. No account, no tracking.
            </p>
          </div>
        </div>

        {showDisclaimer && <DisclaimerModal onAccept={finalize} />}
      </div>
    </div>
  );
}

const FREQUENCY_OPTIONS: { value: DrinkingFrequency; label: string }[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'one_two_nights', label: '1-2 nights a week' },
  { value: 'three_four_nights', label: '3-4 nights a week' },
  { value: 'most_days', label: 'Most days' },
];

const TYPICAL_DRINK_OPTIONS: { value: TypicalDrinksBand; label: string }[] = [
  { value: 'two_three', label: '2-3' },
  { value: 'four_six', label: '4-6' },
  { value: 'seven_ten', label: '7-10' },
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
  { value: 'great', label: 'Great' },
  { value: 'okay', label: 'Okay' },
  { value: 'poor', label: 'Poor' },
];

const HYDRATION_OPTIONS: { value: HydrationHabit; label: string }[] = [
  { value: 'under_1l', label: '<1L' },
  { value: 'one_two_l', label: '1-2L' },
  { value: 'two_three_l', label: '2-3L' },
  { value: 'three_plus_l', label: '3L+' },
];

function IntroSlideScreen({ slide, index }: { slide: IntroSlide; index: number }) {
  if (slide.visual === 'intro') {
    return (
      <div className="h-full min-h-0 flex flex-col pt-1">
        <div className="shrink-0 text-center">
          <div className="eyebrow mb-3">PLAN. STAY CLOSE. LEARN.</div>
          <h1 className="font-display text-[44px] leading-[0.98] tracking-[-0.04em] text-ink">
            <BrandTitle title={slide.title} />
          </h1>
          <p className="text-[17px] leading-snug text-ink-muted mt-4">{slide.body}</p>
          {slide.support && (
            <p className="font-display italic text-[20px] leading-[1.2] text-ink-muted mt-5">
              {slide.support}
            </p>
          )}
        </div>

        <div className="mt-5 min-h-[260px] flex-1 rounded-[34px] border border-line bg-warm-sand/10 shadow-card-lg overflow-hidden">
          <MountainDuskArt className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center text-center py-1">
      <ArtCircle>{renderIntroArt(slide.visual)}</ArtCircle>

      <div className="mt-2.5 h-9 w-9 rounded-full border border-line bg-bg-card font-display text-[17px] text-ink flex items-center justify-center shadow-card">
        {index + 1}
      </div>

      <h1 className="font-display text-[34px] leading-[1.02] tracking-[-0.04em] text-ink mt-2.5 max-w-[15rem]">
        {slide.title}
      </h1>
      <p className="text-[14px] leading-snug text-ink-muted mt-2 max-w-[18rem]">{slide.body}</p>

      <div className="w-full mt-3">{renderIntroPanel(slide.visual)}</div>
    </div>
  );
}

function renderIntroArt(visual: IntroSlide['visual']) {
  switch (visual) {
    case 'plan':
      return <ChecklistStillLifeArt className="h-full w-full" />;
    case 'tonight':
      return <GlassStillLifeArt className="h-full w-full" />;
    case 'recap':
      return <SleepArt className="h-full w-full scale-[1.14]" />;
    case 'insights':
      return <TrendSparkArt className="h-full w-full" />;
    default:
      return null;
  }
}

function renderIntroPanel(visual: IntroSlide['visual']) {
  switch (visual) {
    case 'plan':
      return <PlanPreviewPanel />;
    case 'tonight':
      return <TonightPreviewPanel />;
    case 'recap':
      return <RecapPreviewPanel />;
    case 'insights':
      return <InsightsPreviewPanel />;
    default:
      return null;
  }
}

function PlanPreviewPanel() {
  return (
    <div className="rounded-[28px] border border-line bg-bg-card/95 shadow-card overflow-hidden text-left">
      <div className="p-4">
        <div className="eyebrow">TONIGHT'S CALL</div>
        <div className="flex items-start gap-4 mt-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-[26px] leading-[1.02] tracking-[-0.03em] text-ink">
              Your personal target.
            </div>
            <p className="text-sm leading-snug text-ink-muted mt-2">
              Built from sleep, water, and the kind of night you're planning.
            </p>
          </div>
          <div className="w-16 h-16 rounded-[18px] overflow-hidden border border-line bg-warm-sand/10 shrink-0">
            <BacCurveArt />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-line">
        <MiniPreviewCell label="Stay near" value="your line" />
        <MiniPreviewCell label="Adjust if" value="plans shift" />
      </div>
    </div>
  );
}

function TonightPreviewPanel() {
  return (
    <div className="rounded-[28px] border border-line bg-bg-card/95 shadow-card p-2.5 space-y-2 text-left">
      {[
        'Water between rounds',
        'Eat before first drink',
        'Set a stop time',
      ].map((label, index) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-[18px] border border-line bg-bg-elev/70 px-3 py-2.5"
        >
          <div className="h-8 w-8 rounded-full border border-line bg-warm-sand/10 flex items-center justify-center text-sky">
            {index < 2 ? <Check className="h-4 w-4" /> : <div className="h-3 w-3 rounded-full border border-ink-dim/40" />}
          </div>
          <div className="font-display text-[17px] leading-tight text-ink">{label}</div>
        </div>
      ))}
    </div>
  );
}

function RecapPreviewPanel() {
  return (
    <div className="rounded-[28px] border border-line bg-bg-card/95 shadow-card overflow-hidden text-left">
      <div className="px-3.5 pt-3 pb-2.5 border-b border-line">
        <div className="eyebrow">MORNING FEEL</div>
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <div
                key={value}
                className={cn(
                  'h-8 w-8 rounded-full border flex items-center justify-center font-mono text-[10px]',
                  value === 4
                    ? 'border-accent bg-accent/12 text-accent'
                    : 'border-line bg-bg-elev/70 text-ink-dim',
                )}
              >
                {value}
              </div>
            ))}
          </div>
          <div className="font-display text-[24px] leading-none text-ink">4 / 5</div>
        </div>
      </div>

      <div className="px-3.5 py-3 space-y-2.5">
        <div>
          <div className="eyebrow mb-1.5">SYMPTOMS</div>
          <div className="flex flex-wrap gap-2">
            {['Tired', 'Dry', 'Headache'].map((label) => (
              <span
                key={label}
                className="rounded-full border border-line bg-warm-sand/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-1.5">NOTES</div>
          <div className="rounded-[16px] border border-line bg-bg-elev/70 px-3 py-2 text-[13px] text-ink-muted">
            Anything that stood out...
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightsPreviewPanel() {
  return (
    <div className="rounded-[28px] border border-line bg-bg-card/95 shadow-card overflow-hidden text-left">
      <div className="p-3.5">
        <div className="eyebrow">WHAT WE'RE LEARNING</div>
        <div className="flex items-start gap-3 mt-2.5">
          <div className="min-w-0 flex-1">
            <div className="font-display text-[22px] leading-[1.06] tracking-[-0.03em] text-ink">
              Hydration is moving your line most.
            </div>
            <p className="font-display italic text-[13px] leading-snug text-ink-muted mt-1.5">
              Every recap helps the next plan feel less generic and more personal.
            </p>
          </div>

          <div className="h-10 w-10 rounded-full border border-line bg-warm-sand/10 flex items-center justify-center text-sky shrink-0">
            <Droplets className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-bg-elev/70 h-8 overflow-hidden">
        <TrendSparkArt />
      </div>
    </div>
  );
}

function BrandTitle({ title }: { title: string }) {
  const [before, after] = title.split('PacePlan');

  if (!after) return <>{title}</>;

  return (
    <>
      {before}
      <span className="italic text-accent">PacePlan</span>
      {after}
    </>
  );
}

function ArtCircle({ children }: { children: ReactNode }) {
  return (
    <div className="w-[156px] h-[156px] rounded-full border border-line bg-[radial-gradient(circle_at_top,rgba(241,233,218,0.12)_0%,rgba(39,52,73,0.9)_100%)] shadow-card-lg overflow-hidden p-4">
      {children}
    </div>
  );
}

function ProgressDots({
  total,
  current,
  className,
}: {
  total: number;
  current: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-2.5 rounded-full transition-all',
            index === current ? 'w-7 bg-accent' : 'w-2.5 bg-line-2/80',
          )}
        />
      ))}
    </div>
  );
}

function SetupHeader({
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
    <div>
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          className="h-11 w-11 rounded-full border border-line bg-bg-card text-ink flex items-center justify-center transition disabled:opacity-0 disabled:pointer-events-none"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="eyebrow">QUICK SETUP</div>
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-muted mt-1">
            {step} / {total}
          </div>
        </div>

        <div className="w-11" aria-hidden="true" />
      </div>

      <div className="mt-4 h-1.5 rounded-full bg-line/70 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        />
      </div>
    </div>
  );
}

function StepShell({
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
      <h1 className="font-display text-[36px] leading-[1.06] tracking-[-0.03em] text-ink mt-3">
        {title}
      </h1>
      {caption && <p className="text-[15px] leading-snug text-ink-muted mt-3 mb-6">{caption}</p>}
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
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="eyebrow mb-2.5">{label}</div>
      {children}
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
    <div
      className={cn(
        'rounded-[18px] border border-line bg-bg-card px-4 py-3 text-sm leading-snug text-ink-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={cn(
        'w-full rounded-[22px] border px-4 py-4 text-left transition-all',
        selected
          ? 'border-accent bg-accent text-white shadow-fab'
          : 'border-line bg-bg-elev text-ink hover:bg-bg-card',
      )}
    >
      <div className="font-display text-[18px] leading-tight">{label}</div>
      {sub && (
        <div className={cn('font-mono text-[10px] tracking-[0.12em] uppercase mt-1.5', selected ? 'text-white/80' : 'text-ink-dim')}>
          {sub}
        </div>
      )}
    </motion.button>
  );
}

function SegmentButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[52px] rounded-[18px] border px-3 py-3 font-display text-[17px] leading-tight transition-all',
        selected
          ? 'border-accent bg-accent text-white shadow-press'
          : 'border-line bg-bg-card text-ink hover:bg-bg-elev',
      )}
    >
      {label}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-bg-elev/75 px-3 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
        {label}
      </div>
      <div className="font-display text-[17px] leading-snug text-ink mt-2">{value}</div>
    </div>
  );
}

function MiniPreviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-card px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">{label}</div>
      <div className="font-display text-[18px] leading-tight text-ink mt-2">{value}</div>
    </div>
  );
}

function verdictLabel(score: number): string {
  if (score >= 70) return 'Low risk';
  if (score >= 45) return 'Moderate risk';
  return 'Not worth it';
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
