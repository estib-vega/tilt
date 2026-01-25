import type { OllamaStatus } from '@api/model/ollama';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export const useOllamaStore = create(
  combine(
    {
      status: null as OllamaStatus | null,
    },
    (set) => ({
      setStatus: (status: OllamaStatus | null) =>
        set((state) => ({
          ...state,
          status: status,
        })),
    }),
  ),
);
