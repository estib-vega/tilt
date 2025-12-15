import { useUiSettingsStore } from '@/store';
import React from 'react';

export function useUpdateTheme() {
  const uiTheme = useUiSettingsStore((state) => state.theme);

  // Apply theme
  React.useEffect(() => {
    if (uiTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [uiTheme]);
}

export function useThemeToggle() {
  const theme = useUiSettingsStore((state) => state.theme);
  const toggleDarkmode = useUiSettingsStore((state) => state.toggleDarkmode);
  return [theme, toggleDarkmode] as const;
}
