import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';

type Props = {
  onAccept: () => void;
};

export function DisclaimerModal({ onAccept }: Props) {
  const [agreed, setAgreed] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
      <div className="bg-bg-card rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className="h-6 w-6 text-risk-yellow" />
          <h2 className="text-lg font-semibold text-ink">Before you start</h2>
        </div>
        <div className="text-sm text-ink-muted space-y-3 mb-4">
          <p>
            Hangover Buddy gives <strong className="text-ink">rough estimates</strong> of
            blood alcohol concentration based on body weight, sex, and what you log. Real
            BAC depends on many factors this app cannot see — medications, hydration,
            health conditions, fatigue, and individual metabolism.
          </p>
          <p className="text-risk-red">
            <strong>Never use this app to decide if you're safe to drive.</strong> The
            only safe BAC for driving is 0.00.
          </p>
          <p>
            Estimates are not valid if you are pregnant, on medication that interacts
            with alcohol, or have a liver, kidney, or metabolic condition. If you feel
            unwell, stop drinking and seek help. In Australia: Lifeline 13 11 14.
          </p>
        </div>
        <label className="flex items-start gap-3 mb-4 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 accent-accent"
          />
          <span className="text-sm text-ink">
            I understand these are estimates only and won't use them to decide whether to
            drive.
          </span>
        </label>
        <Button
          className="w-full"
          size="lg"
          disabled={!agreed}
          onClick={onAccept}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
