import FileDiff from '@/components/FileDiff';
import { useButDiff } from '@/model/api/but';
import { useProjectsStore } from '@/store';
import type { JsonChange } from '@api/model/but';
import { createFileRoute, redirect } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/branch/$branchName')({
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
  const params = Route.useParams();
  const { butPath, repositoryPath } = Route.useLoaderData();

  if (!butPath || !repositoryPath) {
    return (
      <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
        <h1>Please configure a repository path and but path in order to use this feature</h1>
      </div>
    );
  }

  return (
    <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
      <React.Suspense>
        <BranchView
          butPath={butPath}
          repositoryPath={repositoryPath}
          branchName={params.branchName}
        />
      </React.Suspense>
    </div>
  );
}

interface BranchViewProps {
  butPath: string;
  repositoryPath: string;
  branchName: string;
}

function BranchView(props: BranchViewProps) {
  const { data: diff } = useButDiff(props.butPath, props.repositoryPath, props.branchName);
  return (
    <div className="flex flex-col gap-4 overflow-y-auto scrollbar-muted w-full">
      {diff.changes.map((change, index) => (
        <FileChange key={change.id ?? index} change={change} />
      ))}
    </div>
  );
}

interface FileChangeProps {
  change: JsonChange;
}

function FileChange(props: FileChangeProps) {
  switch (props.change.diff.type) {
    case 'binary':
      return (
        <div>
          <p>binary</p>
        </div>
      );
    case 'tooLarge':
      return (
        <div>
          <p>too large</p>
        </div>
      );
    case 'patch':
      return (
        <FileDiff
          filePath={props.change.path}
          oldFilePath={props.change.oldPath}
          hunks={props.change.diff.hunks}
        />
      );
  }
}
