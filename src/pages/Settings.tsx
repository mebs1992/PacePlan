import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';

export function SettingsPage() {
  const profile = useProfile((s) => s.profile);
  const resetProfile = useProfile((s) => s.reset);
  const clearHistory = useSession((s) => s.clearHistory);

  return (
    <div className="max-w-md mx-auto p-4 pb-28 space-y-3">
      <header className="mt-6 mb-2">
        <h1 className="text-3xl font-bold text-ink">Settings</h1>
      </header>

      <Card>
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-3">
          Profile
        </h2>
        {profile ? (
          <ul className="text-ink text-sm space-y-2">
            {[
              ['Name', profile.name],
              ['Sex', profile.sex],
              ['Age', String(profile.age)],
              ['Height', `${profile.heightCm} cm`],
              ['Weight', `${profile.weightKg} kg`],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center justify-between">
                <span className="text-ink-muted">{k}</span>
                <span className="capitalize">{v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-muted text-sm">No profile.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-3">
          About
        </h2>
        <p className="text-ink-muted text-sm leading-relaxed">
          Hangover Buddy estimates blood alcohol concentration using the Widmark formula
          with food-modulated absorption. Standard drink size: 10 g pure alcohol
          (Australia). Estimates are approximate and not a substitute for sober
          judgment.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="tel:131114"
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-ink text-sm"
          >
            Lifeline 13 11 14
          </a>
          <a
            href="https://drinkwise.org.au/"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-ink text-sm"
          >
            DrinkWise.org.au
          </a>
        </div>
      </Card>

      <Card>
        <h2 className="text-[11px] font-semibold text-ink-muted uppercase tracking-[0.2em] mb-3">
          Data
        </h2>
        <div className="space-y-2">
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
      </Card>
    </div>
  );
}
