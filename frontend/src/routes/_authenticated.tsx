import { useIsAuthenticatedOptions } from "@/components/hooks/auth";
import {
  createFileRoute,
  ParsedLocation,
  redirect,
} from "@tanstack/react-router";

function redirectToLogin(location: ParsedLocation) {
  return redirect({
    to: "/login",
    search: {
      redirect: location.href,
    },
  });
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location, context }) => {
    const { queryClient } = context;

    try {
      const isAuthed = await queryClient.fetchQuery(useIsAuthenticatedOptions);

      if (!isAuthed) {
        throw redirectToLogin(location);
      }
    } catch (error) {
      throw redirectToLogin(location);
    }
  },
});
