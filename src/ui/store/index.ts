import type { UsageUpdate } from '@api/ai/chat';
import type { ModelIdentifier } from '@api/ai/model';
import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    combine(
      {
        chatUsesWebSearch: {} as Record<string, boolean>,
        chatUsesModelIdentifier: {} as Record<string, ModelIdentifier>,
        chatUsage: {} as Record<string, UsageUpdate>,
      },
      (set) => ({
        // CHAT OPTIONS
        setChatUsesWebSearch: (chatId: string, usesWebSearch: boolean) =>
          set((state) => ({
            chatUsesWebSearch: { ...state.chatUsesWebSearch, [chatId]: usesWebSearch },
          })),
        setChatUsesModelIdentifier: (chatId: string, modelIdentifier: ModelIdentifier) =>
          set((state) => ({
            chatUsesModelIdentifier: {
              ...state.chatUsesModelIdentifier,
              [chatId]: modelIdentifier,
            },
          })),
        // CHAT USAGE
        setChatUsage: (chatId: string, usage: UsageUpdate) =>
          set((state) => ({
            chatUsage: { ...state.chatUsage, [chatId]: usage },
          })),
        forgetChat: (chatId: string) =>
          set((state) => {
            const { [chatId]: _, ...restWebSearch } = state.chatUsesWebSearch;
            const { [chatId]: __, ...restModelIdentifier } = state.chatUsesModelIdentifier;
            const { [chatId]: ___, ...restUsage } = state.chatUsage;
            return {
              chatUsesWebSearch: restWebSearch,
              chatUsesModelIdentifier: restModelIdentifier,
              chatUsage: restUsage,
            };
          }),
      }),
    ),
    {
      name: 'chat-store',
    },
  ),
);

type UITheme = 'light' | 'dark';

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
