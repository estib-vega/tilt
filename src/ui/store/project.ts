import type { ProjectId } from '@api/db/tables/projects';
import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

export const useProjectsStore = create(
  persist(
    combine(
      {
        projectId: null as ProjectId | null,
        repositoryPaths: {} as Record<ProjectId, string | undefined>,
        butPaths: {} as Record<ProjectId, string | undefined>,
      },
      (set) => ({
        setProject: (projectId: ProjectId | null) =>
          set((state) => ({
            ...state,
            projectId,
          })),
        setRepositoryPath: (projectId: ProjectId, repositoryPath: string) =>
          set((state) => ({
            ...state,
            repositoryPaths: {
              ...state.repositoryPaths,
              [projectId]: repositoryPath,
            },
          })),
        setButPath: (projectId: ProjectId, butPath: string) =>
          set((state) => ({
            ...state,
            butPaths: {
              ...state.butPaths,
              [projectId]: butPath,
            },
          })),
      }),
    ),
    {
      name: 'project-store',
    },
  ),
);
