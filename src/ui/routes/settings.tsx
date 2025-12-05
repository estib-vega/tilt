import { useListModels } from '@/model/api/model';
import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import AddModelDialog from '@/components/AddModelDialog';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="max-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold">settings</h1>
        <ModelSettings />
      </div>
    </div>
  );
}
function ModelSettings() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">model</h2>
      <div>
        <AddModelDialog />
      </div>
      <React.Suspense fallback={<div>loading models...</div>}>
        <ModelsList />
      </React.Suspense>
    </div>
  );
}

function ModelsList() {
  const { data: models } = useListModels();

  if (models.length === 0) {
    return <p className="text-sm text-muted-foreground">no models set up.</p>;
  }

  return (
    <div>
      {models.map((model) => (
        <div key={model.id}>{model.name}</div>
      ))}
    </div>
  );
}
