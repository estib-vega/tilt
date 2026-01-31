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

  const query = useSuspenseQuery({
    queryKey: ['ollama', 'status'],
    queryFn: async () => {
      const state = useOllamaStore.getState();
      if (state.status !== null) {
        return state.status;
      }
      return api();
    },
    initialData: ollamaStatus ?? undefined,
  });

  const refetch = async () => {
    await api();
    await query.refetch();
  };
  return { data: query.data, refetch };
}
