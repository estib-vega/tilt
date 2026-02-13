import StackComponent from '@/components/Stack';
import { useButStatus } from '@/model/api/but';
import { RepoDataCtx } from '@/model/repo';
import { useProjectsStore } from '@/store';
import { createFileRoute, redirect } from '@tanstack/react-router';
import React, { type JSX } from 'react';

export const Route = createFileRoute('/repo')({
  component: RouteComponent,
  loader: () => {
    const state = useProjectsStore.getState();
    const projectId = state.projectId;
    if (!projectId) {
      // If there's no projectId selected, redirect to chat
      throw redirect({
        to: '/chat',
      });
    }
    const repositoryPath = state.repositoryPaths[projectId];
    const butPath = state.butPaths[projectId];
    return { projectId, repositoryPath, butPath };
  },
});

function RouteComponent() {
  const { projectId, butPath, repositoryPath } = Route.useLoaderData();

  if (!butPath || !repositoryPath) {
    return (
      <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
        <h1>Please configure a repository path and but path in order to use this feature</h1>
      </div>
    );
  }

  return (
    <RepoDataCtx.Provider
      value={{
        projectId,
        butPath,
        repositoryPath,
      }}
    >
      <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
        <React.Suspense>
          <Repo butPath={butPath} repositoryPath={repositoryPath} />
        </React.Suspense>
      </div>
      ;
    </RepoDataCtx.Provider>
  );
}

interface RepoProps {
  butPath: string;
  repositoryPath: string;
}

function Repo(props: RepoProps): JSX.Element {
  const { data: status } = useButStatus(props.butPath, props.repositoryPath);
  return (
    <div className="flex flex-col">
      <div className="flex overflow-y-auto scrollbar-muted">
        {status.stacks.map((stack) => (
          <StackComponent key={stack.cliId} stack={stack} />
        ))}
      </div>
    </div>
  );
}
