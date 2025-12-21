import { Button } from '@/components/ui/button';
import { useDeleteNoteMutation, useListNotes, useNewNoteMutation } from '@/model/api/notes';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import React from 'react';

export const Route = createFileRoute('/notes/')({
  component: NotesPage,
});

function NotesPage() {
  const createNote = useNewNoteMutation();
  const navigate = Route.useNavigate();

  const handleNewNote = async () => {
    const id = await createNote.mutateAsync('new note');
    await navigate({ to: `/notes/${id}` });
  };

  return (
    <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold">notes</h1>
        <Button onClick={handleNewNote}>New Note</Button>
        <React.Suspense>
          <NotesList />
        </React.Suspense>
      </div>
    </div>
  );
}

function NotesList() {
  const { data: notes } = useListNotes();
  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <NoteListItem
          key={note.id}
          noteId={note.id}
          noteTitle={note.title}
          noteDescription={note.description}
        />
      ))}
    </div>
  );
}

interface NoteListItemProps {
  noteId: number;
  noteTitle: string | null;
  noteDescription: string | null;
}

function NoteListItem(props: NoteListItemProps) {
  const { noteId, noteTitle, noteDescription } = props;
  const deleteNote = useDeleteNoteMutation();

  const handleDelete = async () => {
    await deleteNote.mutateAsync(noteId);
  };

  return (
    <div className="p-4 border rounded-md flex">
      <div className="flex-1 flex flex-col">
        <Link to={'/notes/$notesId'} params={{ notesId: String(noteId) }} className="block">
          <h2 className="text-lg font-semibold">{noteTitle || 'Untitled Note'}</h2>
        </Link>
        {noteDescription && <p className="text-sm text-gray-600">{noteDescription}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={handleDelete}>
        <Trash2 />
      </Button>
    </div>
  );
}
