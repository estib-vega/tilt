import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="h-full flex flex-col">
      <div className="container flex flex-col justify-center items-center gap-4 py-4">
        <h3 className="text-primary text-xl">Welcome Home!</h3>
      </div>
    </div>
  );
}
