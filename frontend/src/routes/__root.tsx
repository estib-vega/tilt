import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="w-screen h-screen fixed flex flex-col border">
      <header className="flex flex-col px-8 py-4 text-primary gap-1">
        <h1 className="text-4xl font-bold">tilt</h1>
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
      </header>
      <hr />
      <main className="overflow-hidden h-full">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
});
