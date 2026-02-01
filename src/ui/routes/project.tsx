import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/project')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold">project</h1>
      </div>
    </div>
  );
}
