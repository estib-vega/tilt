import { useProjectStore } from '@/store';
import type { WriteNoteParams } from '@api/api';
import type { ProjectId } from '@api/db/tables/projects';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

const useListNotesQueryOptions = (projectId: ProjectId | null) =>
  queryOptions({
    queryKey: ['notes', projectId ?? 'all'],
    queryFn: () => window.api.listNotes({ projectId }),
  });

export function useNewNoteMutation() {
  const projectId = useProjectStore((state) => state.projectId);
  const queryClient = useQueryClient();
  const options = useListNotesQueryOptions(projectId);
  return useMutation({
    mutationFn: (content: string) => window.api.newNote({ content, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    },
  });
}

export function useListNotes() {
  const projectId = useProjectStore((state) => state.projectId);
  const options = useListNotesQueryOptions(projectId);
  return useSuspenseQuery(options);
}

export function useNote(noteId: string) {
  return useSuspenseQuery({
    queryKey: ['note', noteId],
    queryFn: () => window.api.readNote({ id: Number(noteId) }),
  });
}

export function useDeleteNoteMutation() {
  const projectId = useProjectStore((state) => state.projectId);
  const queryClient = useQueryClient();
  const options = useListNotesQueryOptions(projectId);
  return useMutation({
    mutationFn: (noteId: number) => window.api.deleteNote({ id: noteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
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
