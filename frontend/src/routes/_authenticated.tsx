import { isAuthenticated } from "@/lib/api";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const isAuthed = await isAuthenticated();
    if (!isAuthed) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
});
