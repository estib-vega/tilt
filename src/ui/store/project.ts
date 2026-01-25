import type { ProjectId } from '@api/db/tables/projects';
import { create } from 'zustand';
import { persist, combine } from 'zustand/middleware';

export const useProjectStore = create(
  persist(
    combine(
      {
        projectId: null as ProjectId | null,
      },
      (set) => ({
        setProject: (projectId: ProjectId | null) =>
          set((state) => ({
            ...state,
            projectId: projectId,
          })),
      }),
    ),
    {
      name: 'chat-store',
    },
  ),
);
