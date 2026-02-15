import StackComponent from '@/components/Stack';
import { useButStatus } from '@/model/api/but';
import { useGetProjectMetadata } from '@/model/api/project';
import { useProjectsStore } from '@/store';
import type { ProjectId } from '@api/db/tables/projects';
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
    return { projectId };
  },
});

function RouteComponent() {
  const { projectId } = Route.useLoaderData();
  return (
    <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
      <React.Suspense>
        <View projectId={projectId} />
      </React.Suspense>
    </div>
  );
}

interface ViewProps {
  projectId: ProjectId;
}

function View(props: ViewProps) {
  const { data: meta } = useGetProjectMetadata(props.projectId);

  if (!meta.butBinaryPath || !meta.repositoryPath) {
    return <h1>Please configure a repository path and but path in order to use this feature</h1>;
  }

  return (
    <React.Suspense>
      <Repo projectId={props.projectId} />
    </React.Suspense>
  );
}

interface RepoProps {
  projectId: ProjectId;
}

function Repo(props: RepoProps): JSX.Element {
  const { data: status } = useButStatus(props.projectId);
  return (
    <div className="flex flex-col">
      <div className="flex overflow-y-auto scrollbar-muted gap-4">
        {status.stacks.map((stack) => (
          <StackComponent key={stack.cliId} stack={stack} />
        ))}
      </div>
    </div>
  );
}
