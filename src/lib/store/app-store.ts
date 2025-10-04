import { create } from 'zustand';

type UIState = {
  currentTitle: string;
  setTitle: (t: string) => void;
  lastSeenLogAt?: string;
  setLastSeenLogAt: (iso: string) => void;
};

export const useAppStore = create<UIState>((set) => ({
  currentTitle: '',
  setTitle: (t: string) => set({ currentTitle: t }),
  lastSeenLogAt: undefined,
  setLastSeenLogAt: (iso: string) => set({ lastSeenLogAt: iso }),
}));