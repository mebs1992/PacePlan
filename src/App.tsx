import { useEffect, useState } from 'react';
import { Onboarding } from '@/pages/Onboarding';
import { SessionPage } from '@/pages/Session';
import { HistoryPage } from '@/pages/History';
import { SettingsPage } from '@/pages/Settings';
import { MorningRecap } from '@/components/MorningRecap';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import { Beer, History, Settings as SettingsIcon } from 'lucide-react';

type View = 'session' | 'history' | 'settings';

export default function App() {
  const profile = useProfile((s) => s.profile);
  const [view, setView] = useState<View>('session');
  const [recapId, setRecapId] = useState<string | null>(null);
  const justEndedId = useSession((s) => s.justEndedId);
  const clearJustEnded = useSession((s) => s.clearJustEnded);

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
      {view === 'session' && <SessionPage />}
      {view === 'history' && <HistoryPage onOpenRecap={setRecapId} />}
      {view === 'settings' && <SettingsPage />}
      <BottomNav view={view} onChange={setView} />
      {recapId && <MorningRecap sessionId={recapId} onDismiss={dismissRecap} />}
    </div>
  );
}

function BottomNav({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const items: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'session', label: 'Session', icon: <Beer className="h-[22px] w-[22px]" strokeWidth={2} /> },
    { key: 'history', label: 'History', icon: <History className="h-[22px] w-[22px]" strokeWidth={2} /> },
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
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-tap"
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`transition-colors ${active ? 'text-accent' : 'text-ink-dim'}`}
              >
                {it.icon}
              </div>
              <span
                className={`font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
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
