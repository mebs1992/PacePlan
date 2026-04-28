import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HomePage } from '@/pages/Home';
import { Onboarding } from '@/pages/Onboarding';
import { SessionPage } from '@/pages/Session';
import { HistoryPage } from '@/pages/History';
import { InsightsPage } from '@/pages/Insights';
import { SettingsPage } from '@/pages/Settings';
import { MorningRecap } from '@/components/MorningRecap';
import { useProfile } from '@/store/useProfile';
import { inactiveSessionEndAt, useSession } from '@/store/useSession';
import {
  BETA_TYPICAL,
  computeBacAt,
  finalSessionPeak,
  hangoverRiskFor,
  projectedSoberAt,
  safeToDriveAt,
  waterDeficit,
} from '@/lib/bac';
import { Beer, History, House, Sparkles, UserRound } from 'lucide-react';

type View = 'home' | 'session' | 'history' | 'insights' | 'settings';

export default function App() {
  const profile = useProfile((s) => s.profile);
  const active = useSession((s) => s.active);
  const history = useSession((s) => s.history);
  const [view, setView] = useState<View>(() => (active ? 'session' : 'home'));
  const [recapId, setRecapId] = useState<string | null>(null);
  const dismissedRecapIds = useRef<Set<string>>(new Set());
  const justEndedId = useSession((s) => s.justEndedId);
  const clearJustEnded = useSession((s) => s.clearJustEnded);
  const endSessionAt = useSession((s) => s.endSessionAt);
  const pendingRecapId = useSession((s) => s.pendingRecapId);

  useEffect(() => {
    setView((current) => {
      if (active && current === 'home') return 'session';
      if (!active && current === 'session') return 'home';
      return current;
    });
  }, [active]);

  useEffect(() => {
    if (justEndedId) {
      clearJustEnded();
    }
  }, [justEndedId, clearJustEnded]);

  useEffect(() => {
    if (!profile) return;

    function closeInactiveSession() {
      const current = useSession.getState().active;
      if (!current || !profile) return;
      const endedAt = inactiveSessionEndAt(current, Date.now());
      if (!endedAt) return;

      const effectiveStart = current.plannedStartMs ?? current.startedAt;
      const peak = finalSessionPeak(
        profile,
        current.drinks,
        current.food,
        effectiveStart,
        endedAt,
      );
      const underLimitAt = safeToDriveAt(
        { profile, drinks: current.drinks, food: current.food, at: endedAt },
        0.05,
      );
      const soberAt = projectedSoberAt(
        { profile, drinks: current.drinks, food: current.food, at: endedAt },
        0,
      );
      const bacAtWake =
        current.wakeAtMs && current.wakeAtMs > endedAt
          ? computeBacAt(
              {
                profile,
                drinks: current.drinks,
                food: current.food,
                at: current.wakeAtMs,
              },
              BETA_TYPICAL,
            )
          : 0;
      const risk = hangoverRiskFor(
        peak,
        bacAtWake,
        waterDeficit(current.drinks, current.water.length),
      );

      endSessionAt(endedAt, peak, risk, {
        autoEnded: true,
        estimatedUnderLimitAt: underLimitAt,
        estimatedSoberAt: soberAt,
      });
    }

    closeInactiveSession();
    const interval = window.setInterval(closeInactiveSession, 60_000);
    window.addEventListener('focus', closeInactiveSession);
    document.addEventListener('visibilitychange', closeInactiveSession);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', closeInactiveSession);
      document.removeEventListener('visibilitychange', closeInactiveSession);
    };
  }, [active?.id, active?.drinks.length, active?.food.length, active?.water.length, endSessionAt, profile]);

  useEffect(() => {
    if (!profile || recapId) return;

    function showPendingRecap() {
      const pending = pendingRecapId();
      if (pending && !dismissedRecapIds.current.has(pending)) {
        setRecapId(pending);
        setView('home');
      }
    }

    showPendingRecap();
    window.addEventListener('focus', showPendingRecap);
    document.addEventListener('visibilitychange', showPendingRecap);
    return () => {
      window.removeEventListener('focus', showPendingRecap);
      document.removeEventListener('visibilitychange', showPendingRecap);
    };
  }, [history, pendingRecapId, profile, recapId]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [profile, view, active?.id]);

  if (!profile) return <Onboarding />;

  function dismissRecap() {
    if (recapId) dismissedRecapIds.current.add(recapId);
    setRecapId(null);
  }

  return (
    <div className="min-h-full">
      {view === 'home' && (
        <HomePage
          onOpenSession={() => setView('session')}
          onOpenInsights={() => setView('insights')}
          onOpenRecap={setRecapId}
        />
      )}
      {view === 'session' && <SessionPage />}
      {view === 'history' && <HistoryPage onOpenRecap={setRecapId} />}
      {view === 'insights' && (
        <InsightsPage
          onOpenSession={() => setView('session')}
          onOpenRecap={setRecapId}
        />
      )}
      {view === 'settings' && <SettingsPage />}
      <BottomNav view={view} onChange={setView} />
      {recapId && <MorningRecap sessionId={recapId} onDismiss={dismissRecap} />}
    </div>
  );
}

function BottomNav({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const items: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <House className="h-[20px] w-[20px]" strokeWidth={2} /> },
    { key: 'session', label: 'Session', icon: <Beer className="h-[22px] w-[22px]" strokeWidth={2} /> },
    { key: 'history', label: 'History', icon: <History className="h-[22px] w-[22px]" strokeWidth={2} /> },
    { key: 'insights', label: 'Insights', icon: <Sparkles className="h-[22px] w-[22px]" strokeWidth={2} /> },
    { key: 'settings', label: 'You', icon: <UserRound className="h-[22px] w-[22px]" strokeWidth={2} /> },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-bg/85 backdrop-blur-md hairline-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto flex">
        {items.map((it) => {
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-tap focus:outline-none"
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`absolute inset-x-2 top-1 bottom-1 rounded-[18px] transition-all ${
                  active ? 'bg-accent/10 opacity-100' : 'bg-transparent opacity-0'
                }`}
                aria-hidden="true"
              />
              <div
                className={`relative transition-colors ${active ? 'text-accent' : 'text-ink-dim'}`}
              >
                {it.icon}
              </div>
              <span
                className={`relative font-mono text-[9px] tracking-[0.11em] uppercase transition-colors ${
                  active ? 'text-accent' : 'text-ink-dim'
                }`}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
