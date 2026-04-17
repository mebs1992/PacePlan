import { useState } from 'react';
import { Onboarding } from '@/pages/Onboarding';
import { SessionPage } from '@/pages/Session';
import { HistoryPage } from '@/pages/History';
import { SettingsPage } from '@/pages/Settings';
import { useProfile } from '@/store/useProfile';
import { Beer, History, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'session' | 'history' | 'settings';

export default function App() {
  const profile = useProfile((s) => s.profile);
  const [view, setView] = useState<View>('session');

  if (!profile) return <Onboarding />;

  return (
    <div className="min-h-full">
      {view === 'session' && <SessionPage />}
      {view === 'history' && <HistoryPage />}
      {view === 'settings' && <SettingsPage />}
      <BottomNav view={view} onChange={setView} />
    </div>
  );
}

function BottomNav({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const items: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: 'session', label: 'Session', icon: <Beer className="h-5 w-5" /> },
    { key: 'history', label: 'History', icon: <History className="h-5 w-5" /> },
    { key: 'settings', label: 'Settings', icon: <SettingsIcon className="h-5 w-5" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur border-t border-bg-elev/40 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="max-w-md mx-auto grid grid-cols-3">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 min-tap',
              view === it.key ? 'text-accent' : 'text-ink-muted'
            )}
          >
            {it.icon}
            <span className="text-[11px]">{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
