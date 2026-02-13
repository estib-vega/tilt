import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/repo')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/repo"!</div>;
}
