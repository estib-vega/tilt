import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';

const butStatusOptions = (butPath: string, repositoryPath: string) =>
  queryOptions({
    queryKey: ['but-status', butPath, repositoryPath],
    queryFn: () => window.api.butStatus({ cwd: repositoryPath, binaryPath: butPath }),
  });

export function useButStatus(butPath: string, repositoryPath: string) {
  const options = butStatusOptions(butPath, repositoryPath);
  return useSuspenseQuery(options);
}
