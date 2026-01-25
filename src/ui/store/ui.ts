import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';

export type UITheme = 'light' | 'dark';

interface UISettingsStore {
  theme: UITheme;
}

const initialUISettingsStore: UISettingsStore = {
  theme: 'dark',
};

export const useUiSettingsStore = create(
  persist(
    combine(initialUISettingsStore, (set) => ({
      toggleDarkmode: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
    })),
    {
      name: 'ui-settings-store',
    },
  ),
);
