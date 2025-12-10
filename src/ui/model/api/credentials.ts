import type { AddCredentialParams, DeleteCredentialParams } from '@api/api';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

const listCredentialsQueryOptions = queryOptions({
  queryKey: ['credentials'],
  queryFn: () => window.api.listCredentials(),
});

const listCredentialProvidersQueryOptions = queryOptions({
  queryKey: ['credential-providers'],
  queryFn: () => window.api.listCredentialProviders(),
});

export function useListCredentials() {
  return useSuspenseQuery(listCredentialsQueryOptions);
}

export function useAddCredentialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: AddCredentialParams) => window.api.addCredential(params),
    onSuccess: () => {
      // Invalidate credentials query to refetch updated data
      queryClient.invalidateQueries({ queryKey: listCredentialsQueryOptions.queryKey });
      queryClient.invalidateQueries({ queryKey: listCredentialProvidersQueryOptions.queryKey });
    },
  });
}

export function useDeleteCredentialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteCredentialParams) => window.api.deleteCredential(params),
    onSuccess: () => {
      // Invalidate credentials query to refetch updated data
      queryClient.invalidateQueries({ queryKey: listCredentialsQueryOptions.queryKey });
      queryClient.invalidateQueries({ queryKey: listCredentialProvidersQueryOptions.queryKey });
    },
  });
}

export function useListCredentialProviders() {
  return useSuspenseQuery(listCredentialProvidersQueryOptions);
}
