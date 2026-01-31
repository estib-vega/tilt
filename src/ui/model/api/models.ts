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

  const query = useSuspenseQuery({
    queryKey: ['available-models'],
    queryFn: async () => {
      const state = useModelStore.getState();
      if (state.availableModels !== null) {
        return state.availableModels;
      }
      return api();
    },
    initialData: availableModels ?? undefined,
  });

  const refetch = async () => {
    await api();
    await query.refetch();
  };

  return { data: query.data, refetch };
}

export function useDefaultModel() {
  const defaultModel = useModelStore((state) => state.defaultModel);
  const setDefaultModel = useModelStore((state) => state.setDefaultModel);

  const api = async () => {
    const model = await window.api.getDefaultModel();
    setDefaultModel(model);
    return model;
  };

  const query = useSuspenseQuery({
    queryKey: ['default-model'],
    queryFn: () => {
      const state = useModelStore.getState();
      if (state.defaultModel !== null) {
        return state.defaultModel;
      }
      return api();
    },
    initialData: defaultModel ?? undefined,
  });

  const refetch = async () => {
    await api();
    await query.refetch();
  };

  return { data: query.data, refetch };
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
