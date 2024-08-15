import { isAuthenticated } from "@/lib/api";
import { queryOptions, useQuery } from "@tanstack/react-query";

export const useIsAuthenticatedOptions = queryOptions({
  queryKey: ["isAuthenticated"],
  queryFn: isAuthenticated,
  staleTime: Infinity,
})

export function useIsAuthenticated() {
  return useQuery(useIsAuthenticatedOptions);
}