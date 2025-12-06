import type { Model, ModelId, ModelProvider, ModelWithId } from '@api/ai/model';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';

export const modelsQueryOptions = {
  queryKey: ['models'],
  queryFn: async () => window.api.listModels(),
  retry: false,
};

export function useListModels() {
  return useSuspenseQuery(modelsQueryOptions);
}

export function useListModelsGroupedByProvider(): [ModelProvider, ModelWithId[]][] {
  const { data: models } = useListModels();
  const groups = React.useMemo(() => {
    const grouped: Partial<Record<ModelProvider, ModelWithId[]>> = {};
    for (const model of models) {
      const group = grouped[model.provider];
      if (!group) {
        grouped[model.provider] = [model];
        continue;
      }
      group.push(model);
    }
    return grouped;
  }, [models]);

  return Object.entries(groups) as [ModelProvider, ModelWithId[]][];
}

export function createModelMutaion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (model: Model) => {
      return window.api.addModel({ model });
    },
    onSuccess: () => {
      // Invalidate models query to refetch updated data
      queryClient.invalidateQueries({ queryKey: modelsQueryOptions.queryKey });
    },
  });
}

export function deleteModelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (modelId: ModelId) => {
      return window.api.deleteModel({ modelId });
    },
    onSuccess: () => {
      // Invalidate models query to refetch updated data
      queryClient.invalidateQueries({ queryKey: modelsQueryOptions.queryKey });
    },
  });
}
