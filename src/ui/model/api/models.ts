import { useChatStore } from '@/store';
import { useModelStore } from '@/store/models';
import type { ModelIdentifier } from '@api/ai/model';
import { useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

export function useListModels() {
  const availableModels = useModelStore((state) => state.availableModels);
  const setAvailableModels = useModelStore((state) => state.setAvailableModels);

  const api = async () => {
    const modelList = await window.api.listAvailableModels();
    setAvailableModels(modelList);
    return modelList;
  };

  const q = useSuspenseQuery({
    queryKey: ['available-models'],
    queryFn: async () => {
      if (availableModels !== null) {
        return availableModels;
      }
      return api();
    },
    initialData: availableModels ?? undefined,
  });

  const refetch = async () => {
    await api();
    await q.refetch();
  };

  return { ...q, refetch };
}

export function useDefaultModel() {
  const defaultModel = useModelStore((state) => state.defaultModel);
  const setDefaultModel = useModelStore((state) => state.setDefaultModel);

  const api = async () => {
    const model = await window.api.getDefaultModel();
    setDefaultModel(model);
    return model;
  };

  const q = useSuspenseQuery({
    queryKey: ['default-model'],
    queryFn: () => {
      if (defaultModel !== null) {
        return defaultModel;
      }
      return api();
    },
    initialData: defaultModel ?? undefined,
  });

  const refetch = async () => {
    await api();
    await q.refetch();
  };

  return { ...q, refetch };
}

export function useModelSelector(chatId: string) {
  const setChatUsesModelIdentifier = useChatStore((state) => state.setChatUsesModelIdentifier);
  const chatUsesModelIdentifier = useChatStore((state) => state.chatUsesModelIdentifier);
  const { data: defaultModel, refetch } = useDefaultModel();

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
    refetch,
  };
}
