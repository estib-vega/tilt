import { useListModels } from '@/model/api/model';
import { createFileRoute } from '@tanstack/react-router';
import React, { type JSX } from 'react';
import AddModelDialog from '@/components/AddModelDialog';
import type { ModelWithId } from '@api/ai/model';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
      <h2 className="text-xl font-bold">models</h2>
      <div className="w-full flex justify-end mb-2">
        <AddModelDialog />
      </div>
      <React.Suspense fallback={<ModelListSkeleton />}>
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
    <div className="space-y-2">
      {models.map((model) => (
        <ModelItem key={model.id} model={model} />
      ))}
    </div>
  );
}

function ModelListSkeleton(): JSX.Element {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <ModelItemSkeleton key={index} />
      ))}
    </div>
  );
}

interface ModelItemProps {
  model: ModelWithId;
}

function ModelItem(props: ModelItemProps): JSX.Element {
  const { model } = props;

  return (
    <div className="flex border p-4 rounded-md">
      <div className="flex flex-col">
        <h3 className="font-medium text-sm">{model.provider}</h3>
        <h3 className="font-medium">{model.name}</h3>
        {model.baseUrl && <p className="text-sm text-muted-foreground">{model.baseUrl}</p>}
      </div>

      <div className="flex-1">
        <Button variant="destructive" className="float-right cursor-pointer" size="icon">
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

function ModelItemSkeleton(): JSX.Element {
  return (
    <div className="flex border p-4 rounded-md animate-pulse">
      <div className="flex flex-col space-y-2">
        <div className="h-4 w-20 bg-gray-300 rounded"></div>
        <div className="h-6 w-32 bg-gray-300 rounded"></div>
        <div className="h-4 w-40 bg-gray-300 rounded"></div>
      </div>
      <div className="flex-1">
        <div className="h-8 w-8 bg-gray-300 rounded float-right"></div>
      </div>
    </div>
  );
}
