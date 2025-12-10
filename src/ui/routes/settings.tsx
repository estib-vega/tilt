import { useDeleteCredentialMutation, useListCredentials } from '@/model/api/credentials';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import React, { type JSX } from 'react';
import AddCredentialModal from '@/components/AddCredentialModal';
import { useOllamaStatus } from '@/model/api/ollama';
import { Badge } from '@/components/ui/badge';
import { Check, CircleX, TriangleAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="max-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold">settings</h1>
        <OllamaStatus />
        <React.Suspense>
          <CredentialsList />
        </React.Suspense>
      </div>
    </div>
  );
}

function OllamaStatus(): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">ollama</h2>
      <React.Suspense>
        <OllamaStatusBadge />
      </React.Suspense>
    </div>
  );
}

function OllamaStatusBadge(): JSX.Element {
  const { data: status } = useOllamaStatus();

  switch (status.type) {
    case 'available':
      return (
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-green-400">
                <Check />
                connected
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <p>Ollama server is available.</p>
                <p>version: {status.version}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    case 'unavailable':
      return (
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-amber-400">
                <TriangleAlert />
                disconnected
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <p>Ollama server is unavailable.</p>
                <p>Please ensure it is running.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    case 'error':
      return (
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive">
                <CircleX />
                error
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                <p>Failed to contact server.</p>
                <p>{status.message}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
  }
}

function CredentialsList() {
  const { data: credentials } = useListCredentials();
  const deleteMutation = useDeleteCredentialMutation();
  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">credentials</h2>
        <React.Suspense>
          <AddCredentialModal />
        </React.Suspense>
      </div>

      {credentials.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
          <p>no credentials yet. add your first credential to get started.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {credentials.map((cred) => (
            <li
              key={cred.id}
              className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent"
            >
              <strong>{cred.service}</strong>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(cred.id)}
                disabled={deleteMutation.isPending}
              >
                delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
