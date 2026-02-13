import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getProjectMetadataQueryOptions,
  getProjectQueryOptions,
  useDeleteProjectMutation,
  useGetProject,
  useGetProjectMetadata,
  useUpdateProjectMetadataMutation,
} from '@/model/api/project';
import { useProjectsStore } from '@/store';
import type { ProjectId } from '@api/db/tables/projects';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/project')({
  loader: ({ context: { queryClient } }) => {
    const projectId = useProjectsStore.getState().projectId;
    if (!projectId) {
      // If there's no projectId selected, redirect to chat
      throw redirect({
        to: '/chat',
      });
    }
    queryClient.ensureQueryData(getProjectQueryOptions(projectId));
    queryClient.ensureQueryData(getProjectMetadataQueryOptions(projectId));
    return { projectId };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useLoaderData();
  return (
    <div className="min-h-0 h-full w-full p-4 box-border flex justify-center">
      <React.Suspense>
        <Project projectId={projectId} />
      </React.Suspense>
    </div>
  );
}

interface ProjectProps {
  projectId: ProjectId;
}

function Project(props: ProjectProps) {
  const { projectId } = props;
  const { data: project } = useGetProject(projectId);
  const setProject = useProjectsStore((state) => state.setProject);
  const { data: metadata } = useGetProjectMetadata(projectId);
  const projectRepositoryPath = useProjectsStore((state) => state.repositoryPaths[projectId]);
  const setProjectRepositoryPath = useProjectsStore((state) => state.setRepositoryPath);
  const butPath = useProjectsStore((state) => state.butPaths[projectId]);
  const setButPath = useProjectsStore((state) => state.setButPath);

  const deleteProjectMutation = useDeleteProjectMutation();
  const updateMetadataMutation = useUpdateProjectMetadataMutation();
  const navigate = useNavigate();

  const handleDeleteProject = () => {
    deleteProjectMutation.mutate(projectId);
    setProject(null);
    navigate({ to: '/chat' });
  };

  const handleUpdateDescription = (description: string) => {
    updateMetadataMutation.mutate({ projectId, metadata: { description } });
  };

  const handleUpdateSystemPrompt = (systemPrompt: string) => {
    updateMetadataMutation.mutate({ projectId, metadata: { systemPrompt } });
  };

  const handleUpdateRepositoryPath = (repositoryPath: string) => {
    setProjectRepositoryPath(projectId, repositoryPath);
  };

  const handleUpdateButPath = (butPath: string) => {
    setButPath(projectId, butPath);
  };

  if (!project) {
    return (
      <div className="max-w-2xl w-full flex flex-col gap-6">
        <div>Project not found</div>;
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-muted px-2">
        <EditableField
          label="description"
          value={metadata.description ?? ''}
          placeholder="no description"
          onSave={handleUpdateDescription}
          multiline
        />
        <EditableField
          label="system prompt"
          value={metadata.systemPrompt ?? ''}
          placeholder="no system prompt"
          onSave={handleUpdateSystemPrompt}
          multiline
        />
        <EditableField
          label="repository path"
          value={projectRepositoryPath ?? ''}
          placeholder="no associated repository"
          onSave={handleUpdateRepositoryPath}
        />
        {!!projectRepositoryPath && (
          <EditableField
            label="but path"
            value={butPath ?? ''}
            placeholder="the path to your but... binary"
            onSave={handleUpdateButPath}
          />
        )}
        <div className="w-full flex justify-center">
          <Button
            onClick={handleDeleteProject}
            disabled={deleteProjectMutation.isPending}
            variant="destructive"
            className="cursor-pointer"
          >
            delete project
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onSave: (value: string) => void;
  multiline?: boolean;
}

function EditableField(props: EditableFieldProps) {
  const { label, value, placeholder, onSave, multiline } = props;
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 w-full min-w-0">
        <label className="text-sm font-medium">{label}</label>
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            rows={6}
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
          />
        )}
        <div className="flex gap-2">
          <Button className="cursor-pointer" onClick={handleSave} size="sm">
            save
          </Button>
          <Button className="cursor-pointer" onClick={handleCancel} size="sm" variant="outline">
            cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">{label}</label>
        <Button
          className="cursor-pointer"
          onClick={() => setIsEditing(true)}
          size="sm"
          variant="outline"
        >
          edit
        </Button>
      </div>
      <div className="flex flex-col gap-2 w-full min-w-0">
        <p className="flex-1 text-sm text-muted-foreground min-h-5 whitespace-pre">
          {value || placeholder}
        </p>
      </div>
    </div>
  );
}
