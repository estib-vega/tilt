import NavIcon from "@/components/navigation/NavIcon";
import { type QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export interface AppRouteContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<AppRouteContext>()({
  component: () => (
    <div className="dark w-screen h-dvh fixed flex flex-col border bg-background">
      <header className="container flex sm:flex-col px-8 py-4 text-primary gap-2 sm:gap-1">
        <h1 className="text-2xl sm:text-4xl font-bold">tilt</h1>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="group">
            <NavIcon name="home" />
          </Link>
          <Link to="/chat" className="group">
            <NavIcon name="chat" />
          </Link>
        </nav>
      </header>
      <hr />
      <main className="overflow-hidden h-full">
        <Outlet />
      </main>
      {/* <TanStackRouterDevtools  /> */}
    </div>
  ),
});
