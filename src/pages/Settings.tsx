import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';

export function SettingsPage() {
  const profile = useProfile((s) => s.profile);
  const resetProfile = useProfile((s) => s.reset);
  const clearHistory = useSession((s) => s.clearHistory);

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-3">
      <header className="my-4">
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
      </header>

      <Card>
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-2">
          Profile
        </h2>
        {profile ? (
          <ul className="text-ink text-sm space-y-1">
            <li>
              <span className="text-ink-muted">Name:</span> {profile.name}
            </li>
            <li>
              <span className="text-ink-muted">Sex:</span> {profile.sex}
            </li>
            <li>
              <span className="text-ink-muted">Age:</span> {profile.age}
            </li>
            <li>
              <span className="text-ink-muted">Height:</span> {profile.heightCm} cm
            </li>
            <li>
              <span className="text-ink-muted">Weight:</span> {profile.weightKg} kg
            </li>
          </ul>
        ) : (
          <p className="text-ink-muted text-sm">No profile.</p>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-2">
          About
        </h2>
        <p className="text-ink-muted text-sm leading-relaxed">
          Hangover Buddy estimates blood alcohol concentration using the Widmark formula
          with food-modulated absorption. Standard drink size: 10 g pure alcohol
          (Australia). Estimates are approximate and not a substitute for sober
          judgment.
        </p>
        <p className="text-ink-muted text-sm mt-2">
          Need help?{' '}
          <a
            href="tel:131114"
            className="text-accent underline"
            aria-label="Call Lifeline 13 11 14"
          >
            Lifeline 13 11 14
          </a>{' '}
          ·{' '}
          <a
            href="https://drinkwise.org.au/"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            DrinkWise.org.au
          </a>
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wider mb-2">
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
