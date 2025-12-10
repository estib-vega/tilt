import { useSuspenseQuery } from '@tanstack/react-query';

export function useOllamaStatus() {
  return useSuspenseQuery({
    queryKey: ['ollama', 'status'],
    queryFn: () => window.api.ollamaGetStatus(),
  });
}
