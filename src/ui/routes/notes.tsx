import TextEditor from '@/components/TextEditor';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function NotesPage() {
  return (
    <div className="max-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold">notes</h1>
        <div className="space-y-4">
          <p className="text-muted-foreground">your notes will appear here.</p>
          <TextEditor />
        </div>
      </div>
    </div>
  );
}
