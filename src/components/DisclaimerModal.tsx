import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  onAccept: () => void;
};

export function DisclaimerModal({ onAccept }: Props) {
  const [agreed, setAgreed] = useState(false);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="glass-strong rounded-3xl p-6 max-w-md w-full"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-risk-yellow/30 to-risk-red/20 border border-risk-yellow/30">
              <ShieldAlert className="h-5 w-5 text-risk-yellow" />
            </div>
            <h2 className="text-lg font-semibold text-ink">Before you start</h2>
          </div>
          <div className="text-sm text-ink-muted space-y-3 mb-5 leading-relaxed">
            <p>
              Hangover Buddy gives <strong className="text-ink">rough estimates</strong> of
              blood alcohol concentration based on body weight, sex, and what you log.
              Real BAC depends on many factors this app cannot see — medications,
              hydration, health conditions, fatigue, and individual metabolism.
            </p>
            <p className="text-risk-red font-medium">
              Never use this app to decide if you're safe to drive. The only safe BAC for
              driving is 0.00.
            </p>
            <p>
              Estimates are not valid if you are pregnant, on medication that interacts
              with alcohol, or have a liver, kidney, or metabolic condition. If you feel
              unwell, stop drinking and seek help. In Australia: Lifeline 13 11 14.
            </p>
          </div>
          <label className="flex items-start gap-3 mb-5 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 accent-accent"
            />
            <span className="text-sm text-ink">
              I understand these are estimates only and won't use them to decide whether
              to drive.
            </span>
          </label>
          <Button className="w-full" size="lg" disabled={!agreed} onClick={onAccept}>
            I understand — continue
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
