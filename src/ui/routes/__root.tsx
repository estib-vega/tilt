import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
// import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
// import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header';

// import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import type { QueryClient } from '@tanstack/react-query';
import SettingsButton from '@/components/SettingsButton';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  staleTime: Infinity,
  component: () => (
    <>
      <div className="w-full h-full flex flex-col min-h-0">
        <div className="h-12 select-none [-webkit-app-region:drag] flex justify-end">
          {/*  account for the title bar*/}
          <div className="[-webkit-app-region:no-drag] pt-2 pr-2 pointer-events-auto">
            <SettingsButton />
          </div>
        </div>
        <Header />
        <Outlet />
      </div>
      {/* <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          TanStackQueryDevtools,
        ]}
      /> */}
    </>
  ),
});
