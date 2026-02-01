import type { UpdateProjectMetaParams } from '@api/api';
import type { ProjectId } from '@api/db/tables/projects';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

const useListProjectsQueryOptions = queryOptions({
  queryKey: ['projects'],
  queryFn: () => window.api.listProjects(),
});

export function useListProjects() {
  return useSuspenseQuery(useListProjectsQueryOptions);
}

export const getProjectQueryOptions = (projectId: ProjectId) =>
  queryOptions({
    queryKey: ['projects', projectId],
    queryFn: () => window.api.getProject({ projectId }),
  });

export function useGetProject(projectId: ProjectId) {
  return useSuspenseQuery(getProjectQueryOptions(projectId));
}

export const getProjectMetadataQueryOptions = (projectId: ProjectId) =>
  queryOptions({
    queryKey: ['project-metadata', projectId],
    queryFn: () => window.api.getProjectMeta({ projectId }),
  });

export function useGetProjectMetadata(projectId: ProjectId) {
  return useSuspenseQuery(getProjectMetadataQueryOptions(projectId));
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => window.api.createProject({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useListProjectsQueryOptions.queryKey });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: ProjectId) => window.api.deleteProject({ projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useListProjectsQueryOptions.queryKey });
    },
  });
}

export function useUpdateProjectMetadataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: UpdateProjectMetaParams) => window.api.updateProjectMeta(updates),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: getProjectMetadataQueryOptions(projectId).queryKey,
      });
    },
  });
}
