import TextEditor from '@/components/TextEditor';
import { useNote, useWrieNoteMutation } from '@/model/api/notes';
import { createFileRoute } from '@tanstack/react-router';
import type { Editor } from '@tiptap/react';
import React from 'react';

export const Route = createFileRoute('/notes/$notesId')({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  return (
    <div className="min-h-0 h-full w-full p-4 flex justify-center">
      <React.Suspense>
        <Note notesId={params.notesId} />
      </React.Suspense>
    </div>
  );
}

interface NoteProps {
  notesId: string;
}

function debounce<F extends (...args: any[]) => void>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

function Note(props: NoteProps) {
  const { data: note } = useNote(props.notesId);
  const writeNoteMutation = useWrieNoteMutation();

  const save = React.useCallback(
    (editor: Editor) => {
      const content = editor.getMarkdown();
      writeNoteMutation.mutate({ id: Number(props.notesId), content });
    },
    [props.notesId, writeNoteMutation],
  );

  const debouncedSave = React.useMemo(() => debounce(save, 500), [save]);

  return (
    <div className="h-full w-full">
      <TextEditor onBlur={debouncedSave} onChange={debouncedSave} initialContent={note} />
    </div>
  );
}
