import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';

export function SettingsPage() {
  const profile = useProfile((s) => s.profile);
  const resetProfile = useProfile((s) => s.reset);
  const clearHistory = useSession((s) => s.clearHistory);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <div className="max-w-[480px] mx-auto px-5 pt-8 pb-28">
        <header className="mb-6">
          <div className="eyebrow">PREFERENCES</div>
          <h1 className="font-display text-[38px] leading-[1.05] tracking-[-0.02em] text-ink mt-2">
            Settings.
          </h1>
        </header>

        <div className="space-y-4">
          <section className="rounded-[20px] border border-line bg-bg-card p-5">
            <div className="eyebrow mb-3">PROFILE</div>
            {profile ? (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[22px] leading-tight text-ink capitalize">
                    {profile.name}
                  </div>
                  <div className="font-mono text-[11px] text-ink-muted mt-1.5 leading-relaxed">
                    {profile.sex} · {profile.age}y · {profile.heightCm}cm · {profile.weightKg}kg
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="shrink-0 rounded-full px-5"
                  onClick={() => {
                    if (
                      confirm(
                        'Edit profile will reset it. You will be asked to set up again. History is kept.'
                      )
                    ) {
                      resetProfile();
                    }
                  }}
                >
                  Edit
                </Button>
              </div>
            ) : (
              <p className="text-ink-muted text-sm">No profile.</p>
            )}
          </section>

          <section className="rounded-[20px] border border-line bg-bg-card p-5">
            <div className="eyebrow mb-3">ABOUT THE MATH</div>
            <dl className="divide-y divide-line/70">
              <MathRow label="Formula" value="Widmark + food absorption" />
              <MathRow label="β typical" value="0.15 g/L per hour" />
              <MathRow label="r (male/female)" value="0.68 / 0.55" />
              <MathRow label="Standard drink" value="10g ethanol (AU)" />
            </dl>
            <p className="font-mono text-[10px] text-ink-dim mt-4 leading-relaxed tracking-tight">
              Estimates are approximate and not a substitute for sober judgement.
            </p>
          </section>

          <section className="rounded-[20px] border border-line bg-bg-card p-5">
            <div className="eyebrow mb-3">DATA</div>
            <dl className="divide-y divide-line/70 mb-4">
              <MathRow label="Storage" value="this device only" />
              <MathRow label="Accounts" value="none" />
              <MathRow label="Tracking" value="none" />
            </dl>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setPrivacyOpen(true)}
              >
                Privacy policy
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  if (confirm('Clear session history?')) clearHistory();
                }}
              >
                Clear history
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (
                    confirm(
                      'Reset profile? You will be asked to set up again. History is kept.'
                    )
                  ) {
                    resetProfile();
                  }
                }}
              >
                Reset profile
              </Button>
            </div>
          </section>

          <section className="rounded-[20px] border border-line bg-bg-card p-5">
            <div className="eyebrow mb-3">HELP</div>
            <div className="flex flex-wrap gap-2">
              <a
                href="tel:131114"
                className="font-mono text-[11px] tracking-wider uppercase px-3 py-2 rounded-full border border-line text-ink hover:bg-bg-elev transition"
              >
                Lifeline 13 11 14
              </a>
              <a
                href="https://drinkwise.org.au/"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] tracking-wider uppercase px-3 py-2 rounded-full border border-line text-ink hover:bg-bg-elev transition"
              >
                DrinkWise.org.au
              </a>
            </div>
          </section>
        </div>
      </div>
      <Sheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy policy">
        <PrivacyPolicyContent />
      </Sheet>
    </>
  );
}

function MathRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-[14px] text-ink-muted">{label}</dt>
      <dd className="font-mono text-[12px] text-ink text-right max-w-[55%] leading-relaxed">
        {value}
      </dd>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="space-y-5 text-sm text-ink-muted leading-relaxed">
      <section>
        <div className="eyebrow mb-2">WHAT PACEPLAN STORES</div>
        <p>
          PacePlan stores your profile details, disclaimer acknowledgement, active session,
          session history, drink entries, food and water entries, wake-up timing, drive plan
          flag, and any morning recap notes you choose to save.
        </p>
      </section>

      <section>
        <div className="eyebrow mb-2">HOW YOUR DATA IS USED</div>
        <p>
          This information is used only to calculate your estimates, restore your progress,
          and show your history inside the app. PacePlan does not require an account and
          does not sync your data to a backend service.
        </p>
      </section>

      <section>
        <div className="eyebrow mb-2">SHARING AND THIRD PARTIES</div>
        <p>
          PacePlan does not include ads, analytics SDKs, or social sign-in. External help
          links open only if you tap them. The app does not sell your data or share it for
          tracking or advertising.
        </p>
      </section>

      <section>
        <div className="eyebrow mb-2">YOUR CONTROLS</div>
        <p>
          Use <span className="font-mono text-[11px] text-ink">Clear history</span> to erase
          saved sessions and <span className="font-mono text-[11px] text-ink">Reset profile</span>{' '}
          to remove your profile details. Removing the app from your device also removes the
          local app container.
        </p>
      </section>
    </div>
  );
}
