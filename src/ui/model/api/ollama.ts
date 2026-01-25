import { useOllamaStore } from '@/store/ollama';
import { useSuspenseQuery } from '@tanstack/react-query';

export function useOllamaStatus() {
  const ollamaStatus = useOllamaStore((state) => state.status);
  const setOllamaStatus = useOllamaStore((state) => state.setStatus);

  const api = async () => {
    const status = await window.api.ollamaGetStatus();
    setOllamaStatus(status);
    return status;
  };

  const q = useSuspenseQuery({
    queryKey: ['ollama', 'status'],
    queryFn: async () => {
      if (ollamaStatus !== null) {
        return ollamaStatus;
      }
      return api();
    },
    initialData: ollamaStatus ?? undefined,
  });

  const refetch = async () => {
    await api();
    await q.refetch();
  };
  return { ...q, refetch };
}
