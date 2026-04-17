import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types';

type ProfileState = {
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  acceptDisclaimer: () => void;
  reset: () => void;
};

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: null,
      setProfile: (p) => set({ profile: p }),
      acceptDisclaimer: () => {
        const current = get().profile;
        if (!current) return;
        set({ profile: { ...current, acceptedDisclaimerAt: Date.now() } });
      },
      reset: () => set({ profile: null }),
    }),
    { name: 'hangover-buddy:profile' }
  )
);
