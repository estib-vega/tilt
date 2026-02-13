import { RepoDataCtx } from '@/model/repo';
import { useProjectsStore } from '@/store';
import { createFileRoute, redirect } from '@tanstack/react-router';

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
      <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">hello</div>;
    </RepoDataCtx.Provider>
  );
}
