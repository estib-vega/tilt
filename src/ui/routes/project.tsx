import { getProjectQueryOptions, useGetProject } from '@/model/api/project';
import { useProjectStore } from '@/store';
import type { ProjectId } from '@api/db/tables/projects';
import { createFileRoute, redirect } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/project')({
  loader: ({ context: { queryClient } }) => {
    const projectId = useProjectStore.getState().projectId;
    if (!projectId) {
      // If there's no projectId selected, redirect to chat
      throw redirect({
        to: '/chat',
      });
    }
    queryClient.ensureQueryData(getProjectQueryOptions(projectId));
    return { projectId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useLoaderData();
  return (
    <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <React.Suspense>
          <Project projectId={projectId} />
        </React.Suspense>
      </div>
    </div>
  );
}

interface ProjectProps {
  projectId: ProjectId;
}

function Project(props: ProjectProps) {
  const { projectId } = props;
  const { data: project } = useGetProject(projectId);

  if (!project) {
    return <div>Project not found</div>;
  }

  return <h1 className="text-2xl font-bold">{project.name}</h1>;
}
