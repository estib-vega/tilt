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
   * The generated summaries for a given diff, if any.
   */
  diffSummaries: Record<string, UIMessage[] | undefined>;
};

const state: ProjectsState = {
  projectId: null,
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
