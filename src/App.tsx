import { useEffect, useState } from 'react';
import { Onboarding } from '@/pages/Onboarding';
import { SessionPage } from '@/pages/Session';
import { HistoryPage } from '@/pages/History';
import { SettingsPage } from '@/pages/Settings';
import { MorningRecap } from '@/components/MorningRecap';
import { useProfile } from '@/store/useProfile';
import { useSession } from '@/store/useSession';
import { Beer, History, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type View = 'session' | 'history' | 'settings';

export default function App() {
  const profile = useProfile((s) => s.profile);
  const [view, setView] = useState<View>('session');
  const [recapId, setRecapId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const pendingRecapId = useSession((s) => s.pendingRecapId);
  const historyLen = useSession((s) => s.history.length);

  useEffect(() => {
    if (!profile) return;
    const check = () => {
      const id = pendingRecapId();
      if (id && !skipped.has(id)) setRecapId(id);
    };
    check();
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const interval = window.setInterval(check, 60_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      window.clearInterval(interval);
    };
  }, [profile, pendingRecapId, skipped, historyLen]);

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
          {view === 'history' && <HistoryPage onOpenRecap={setRecapId} />}
          {view === 'settings' && <SettingsPage />}
        </motion.div>
      </AnimatePresence>
      <BottomNav view={view} onChange={setView} />
      {recapId && (
        <MorningRecap
          sessionId={recapId}
          onDismiss={() => {
            setSkipped((prev) => new Set(prev).add(recapId));
            setRecapId(null);
          }}
        />
      )}
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
      className="fixed bottom-0 left-0 right-0 z-40 bg-bg-card/95 backdrop-blur-sm hairline-t"
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
                className={`text-[11px] font-semibold transition-colors ${
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
