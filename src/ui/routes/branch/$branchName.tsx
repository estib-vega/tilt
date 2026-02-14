import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/branch/$branchName')({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return <div>Hello "{params.branchName}"!</div>;
}
