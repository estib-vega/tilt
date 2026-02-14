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

const butDiffOptions = (butPath: string, repositoryPath: string, cliId: string) =>
  queryOptions({
    queryKey: ['but-diff', butPath, repositoryPath, cliId],
    queryFn: () => window.api.butDiff({ cwd: repositoryPath, binaryPath: butPath, cliId }),
  });

export function useButDiff(butPath: string, repositoryPath: string, cliId: string) {
  const options = butDiffOptions(butPath, repositoryPath, cliId);
  return useSuspenseQuery(options);
}
