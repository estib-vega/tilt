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

export function useModelSelector(initialModel?: ModelIdentifier) {
  const { data: defaultModel } = useDefaultModel();
  const [selectedModel, setSelectedModel] = React.useState<ModelIdentifier | null>(
    initialModel ?? defaultModel,
  );

  const isSelectedModel = React.useCallback(
    (model: ModelIdentifier) =>
      selectedModel !== null &&
      selectedModel.name === model.name &&
      selectedModel.provider === model.provider,
    [selectedModel],
  );

  return {
    selectedModel,
    setSelectedModel,
    isSelectedModel,
  };
}
