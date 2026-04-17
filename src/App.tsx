import { useState } from 'react';
import { Onboarding } from '@/pages/Onboarding';
import { SessionPage } from '@/pages/Session';
import { HistoryPage } from '@/pages/History';
import { SettingsPage } from '@/pages/Settings';
import { useProfile } from '@/store/useProfile';
import { Beer, History, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

type View = 'session' | 'history' | 'settings';

export default function App() {
  const profile = useProfile((s) => s.profile);
  const [view, setView] = useState<View>('session');

  if (!profile) return <Onboarding />;

  return (
    <div className="min-h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          {view === 'session' && <SessionPage />}
          {view === 'history' && <HistoryPage />}
          {view === 'settings' && <SettingsPage />}
        </motion.div>
      </AnimatePresence>
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <LayoutGroup id="bottom-nav">
          <div className="glass-strong rounded-2xl p-1 flex">
            {items.map((it) => {
              const active = view === it.key;
              return (
                <button
                  key={it.key}
                  onClick={() => onChange(it.key)}
                  className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-tap"
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent/20 to-accent-violet/20 border border-accent/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <div
                    className={`relative z-10 transition-colors ${
                      active ? 'text-accent' : 'text-ink-muted'
                    }`}
                  >
                    {it.icon}
                  </div>
                  <span
                    className={`relative z-10 text-[10px] font-medium transition-colors ${
                      active ? 'text-accent' : 'text-ink-muted'
                    }`}
                  >
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </nav>
  );
}
