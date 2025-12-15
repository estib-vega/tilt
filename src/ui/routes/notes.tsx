import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/notes')({
  component: NotesPage,
});

function NotesPage() {
  return (
    <div className="min-h-0 h-full w-full flex justify-center items-start p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold mb-6">Notes</h1>
        <div className="space-y-4">
          <p className="text-muted-foreground">Your notes will appear here.</p>
        </div>
      </div>
    </div>
  );
}
