import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="max-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-4">settings</h1>
      </div>
    </div>
  );
}
