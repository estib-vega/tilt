import TextEditor from '@/components/TextEditor';
import { useNote } from '@/model/api/notes';
import { createFileRoute } from '@tanstack/react-router';
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

function Note(props: NoteProps) {
  const { data: note } = useNote(props.notesId);
  return (
    <div className="h-full w-full">
      <TextEditor initialContent={note} />
    </div>
  );
}
