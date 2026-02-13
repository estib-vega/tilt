import type { ProjectId } from '@api/db/tables/projects';
import { createContext } from 'react';

export type RepoData = {
  projectId: ProjectId;
  repositoryPath: string;
  butPath: string;
};

export const RepoDataCtx = createContext<RepoData | null>(null);
