import type { ModelIdentifier, ProviderModelList } from '@api/ai/model';
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

export const useModelStore = create(
  combine(
    {
      availableModels: null as ProviderModelList | null,
      defaultModel: null as ModelIdentifier | null,
    },
    (set) => ({
      setAvailableModels: (availableModels: ProviderModelList | null) =>
        set((state) => ({
          ...state,
          availableModels,
        })),
      setDefaultModel: (defaultModel: ModelIdentifier | null) =>
        set((state) => ({
          ...state,
          defaultModel,
        })),
    }),
  ),
);
