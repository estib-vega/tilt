import { useChatStore } from '@/store';
import type { ModelIdentifier } from '@api/ai/model';
import { useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

export function useListModels() {
  return useSuspenseQuery({
    queryKey: ['available-models'],
    queryFn: () => window.api.listAvailableModels(),
  });
}

export function useDefaultModel() {
  return useSuspenseQuery({
    queryKey: ['default-model'],
    queryFn: () => window.api.getDefaultModel(),
  });
}

export function useModelSelector(chatId: string) {
  const setChatUsesModelIdentifier = useChatStore((state) => state.setChatUsesModelIdentifier);
  const chatUsesModelIdentifier = useChatStore((state) => state.chatUsesModelIdentifier);
  const { data: defaultModel } = useDefaultModel();

  const selectedModel = React.useMemo<ModelIdentifier | null>(() => {
    const modelFromStore = chatUsesModelIdentifier[chatId];
    return modelFromStore ?? defaultModel ?? null;
  }, [chatUsesModelIdentifier, chatId, defaultModel]);

  const isSelectedModel = React.useCallback(
    (model: ModelIdentifier) =>
      selectedModel !== null &&
      selectedModel.name === model.name &&
      selectedModel.provider === model.provider,
    [selectedModel],
  );

  const setSelectedModel = React.useCallback<
    React.Dispatch<React.SetStateAction<ModelIdentifier | null>>
  >(
    (value) => {
      const nextModel = typeof value === 'function' ? value(selectedModel) : value;
      if (nextModel !== null) {
        setChatUsesModelIdentifier(chatId, nextModel);
      }
    },
    [chatId, setChatUsesModelIdentifier, selectedModel],
  );

  return {
    selectedModel,
    setSelectedModel,
    isSelectedModel,
  };
}
