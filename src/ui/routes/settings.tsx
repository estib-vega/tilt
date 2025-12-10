import { useDeleteCredentialMutation, useListCredentials } from '@/model/api/credentials';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import AddCredentialModal from '@/components/AddCredentialModal';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="max-h-0 h-full w-full p-4 box-border flex justify-center">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <h1 className="text-2xl font-bold">settings</h1>
        <React.Suspense>
          <CredentialsList />
        </React.Suspense>
      </div>
    </div>
  );
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
