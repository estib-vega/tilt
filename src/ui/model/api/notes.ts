import type { WriteNoteParams } from '@api/api';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

const useListNotesQueryOptions = queryOptions({
  queryKey: ['notes'],
  queryFn: () => window.api.listNotes(),
});

export function useNewNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => window.api.newNote({ content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useListNotesQueryOptions.queryKey });
    },
  });
}

export function useListNotes() {
  return useSuspenseQuery(useListNotesQueryOptions);
}

export function useNote(noteId: string) {
  return useSuspenseQuery({
    queryKey: ['note', noteId],
    queryFn: () => window.api.readNote({ id: Number(noteId) }),
  });
}

export function useDeleteNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: number) => window.api.deleteNote({ id: noteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useListNotesQueryOptions.queryKey });
    },
  });
}

export function useWrieNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: WriteNoteParams) => window.api.writeNote(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note', String(variables.id)] });
    },
  });
}
