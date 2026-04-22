import { useEffect, useState } from 'react';
import { HomePage } from '@/pages/Home';
import { Onboarding } from '@/pages/Onboarding';
import { SessionPage } from '@/pages/Session';
import { HistoryPage } from '@/pages/History';
import { InsightsPage } from '@/pages/Insights';
import { SettingsPage } from '@/pages/Settings';
import { MorningRecap } from '@/components/MorningRecap';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import { Beer, History, House, Sparkles, Settings as SettingsIcon } from 'lucide-react';

type View = 'home' | 'session' | 'history' | 'insights' | 'settings';

export default function App() {
  const profile = useProfile((s) => s.profile);
  const active = useSession((s) => s.active);
  const [view, setView] = useState<View>(() => (active ? 'session' : 'home'));
  const [recapId, setRecapId] = useState<string | null>(null);
  const justEndedId = useSession((s) => s.justEndedId);
  const clearJustEnded = useSession((s) => s.clearJustEnded);

  useEffect(() => {
    setView((current) => {
      if (active && current === 'home') return 'session';
      if (!active && current === 'session') return 'home';
      return current;
    });
  }, [active]);

  useEffect(() => {
    if (justEndedId) {
      setRecapId(justEndedId);
      clearJustEnded();
    }
  }, [justEndedId, clearJustEnded]);

  if (!profile) return <Onboarding />;

  function dismissRecap() {
    setRecapId(null);
    setView('session');
  }

  return (
    <div className="min-h-full">
      {view === 'home' && <HomePage onOpenSession={() => setView('session')} onOpenInsights={() => setView('insights')} />}
      {view === 'session' && <SessionPage />}
      {view === 'history' && <HistoryPage onOpenRecap={setRecapId} />}
      {view === 'insights' && <InsightsPage />}
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
    { key: 'settings', label: 'Settings', icon: <SettingsIcon className="h-[22px] w-[22px]" strokeWidth={2} /> },
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
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 min-tap"
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`transition-colors ${active ? 'text-accent' : 'text-ink-dim'}`}
              >
                {it.icon}
              </div>
              <span
                className={`font-mono text-[9px] tracking-[0.11em] uppercase transition-colors ${
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
