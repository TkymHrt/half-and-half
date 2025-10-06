import { create } from "zustand";

type AppUiState = {
  currentTitle: string;
  lastSeenLogAt?: string;
  setTitle: (title: string) => void;
  setLastSeenLogAt: (timestamp?: string) => void;
};

export const useAppUiStore = create<AppUiState>((set) => ({
  currentTitle: "",
  lastSeenLogAt: undefined,
  setTitle: (currentTitle) => {
    set({ currentTitle });
  },
  setLastSeenLogAt: (timestamp) => {
    set({ lastSeenLogAt: timestamp });
  },
}));
