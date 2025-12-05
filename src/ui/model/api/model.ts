import type { Model, ModelId } from '@api/ai/model';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

export const modelsQueryOptions = {
  queryKey: ['models'],
  queryFn: async () => window.api.listModels(),
  retry: false,
};

export function useListModels() {
  return useSuspenseQuery(modelsQueryOptions);
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
