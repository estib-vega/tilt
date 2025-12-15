import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

import Header from '../components/Header';

import type { QueryClient } from '@tanstack/react-query';
import { useUpdateTheme } from '@/model/ui';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  staleTime: Infinity,
  component: Root,
});

function Root() {
  useUpdateTheme();
  return (
    <>
      <div className="w-full h-full flex flex-col min-h-0">
        <div className="h-12 select-none [-webkit-app-region:drag] flex justify-end">
          <Header />
        </div>
        <Outlet />
      </div>
    </>
  );
}
