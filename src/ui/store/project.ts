import type { ProjectId } from '@api/db/tables/projects';
import type { UIMessage } from 'ai';
import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

type ProjectsState = {
  /**
   * The selected project id, if any.
   */
  projectId: ProjectId | null;
  /**
   * The repository paths associated with a given project, if any.
   */
  repositoryPaths: Record<ProjectId, string | undefined>;
  /**
   * The but binary path associated with a given project, if any.
   */
  butPaths: Record<ProjectId, string | undefined>;
  /**
   * The generated summaries for a given diff, if any.
   */
  diffSummaries: Record<string, UIMessage[] | undefined>;
};

const state: ProjectsState = {
  projectId: null,
  repositoryPaths: {},
  butPaths: {},
  diffSummaries: {},
};

export const useProjectsStore = create(
  persist(
    combine(state, (set) => ({
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
      upsertSummaryMessage: (summaryId: string, message: UIMessage) =>
        set((state) => {
          const messages =
            state.diffSummaries[summaryId] !== undefined ? [...state.diffSummaries[summaryId]] : [];

          // If this message already exists (matching id), replace it
          const idx = messages.findIndex((m) => m.id === message.id);
          if (idx >= 0) {
            messages[idx] = message;
            return {
              ...state,
              diffSummaries: {
                ...state.diffSummaries,
                [summaryId]: messages,
              },
            };
          }

          // Otherwise append
          return {
            ...state,
            diffSummaries: {
              ...state.diffSummaries,
              [summaryId]: [...messages, message],
            },
          };
        }),
      clearSummary: (summaryId: string) =>
        set((state) => {
          return {
            ...state,
            diffSummaries: {
              ...state.diffSummaries,
              [summaryId]: undefined,
            },
          };
        }),
    })),
    {
      name: 'project-store',
    },
  ),
);
