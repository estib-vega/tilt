import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/commit/$commitId')({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return <div>Hello "{params.commitId}"!</div>;
}
