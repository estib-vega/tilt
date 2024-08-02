import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="dark w-screen h-dvh fixed flex flex-col border bg-background">
      <header className="container flex sm:flex-col px-8 py-4 text-primary gap-2 sm:gap-1">
        <h1 className="text-2xl sm:text-4xl font-bold">tilt</h1>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="[&.active]:font-bold">
            Home
          </Link>
          <Link to="/chat" className="[&.active]:font-bold">
            Chat
          </Link>
        </nav>
      </header>
      <hr />
      <main className="overflow-hidden h-full">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  ),
});
