import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import React from 'react';
import { useCreateProjectMutation } from '@/model/api/project';
import { useProjectsStore } from '@/store';
import { getDefaultChatId } from '@/model/api/chat';
import { useNavigate } from '@tanstack/react-router';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectModal(props: NewProjectModalProps) {
  const [projectName, setProjectName] = React.useState('');
  const createProjectMutation = useCreateProjectMutation();
  const setProjectId = useProjectsStore((state) => state.setProject);
  const navigate = useNavigate();

  const handleCancelCreate = () => {
    props.onOpenChange(false);
    setProjectName('');
  };

  const handleConfirmCreate = async () => {
    const projectId = await createProjectMutation.mutateAsync(projectName.trim());
    setProjectId(projectId);
    const defaultChatId = await getDefaultChatId(projectId);
    props.onOpenChange(false);
    setProjectName('');
    navigate({ to: '/chat', search: defaultChatId ? { chatId: defaultChatId } : {} });
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>create new project</DialogTitle>
          <DialogDescription>enter a name for your new project.</DialogDescription>
        </DialogHeader>
        <Input
          disabled={createProjectMutation.isPending}
          placeholder="project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && projectName.trim()) {
              handleConfirmCreate();
            }
          }}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancelCreate}
            disabled={createProjectMutation.isPending}
          >
            cancel
          </Button>
          <Button
            onClick={handleConfirmCreate}
            disabled={!projectName.trim() || createProjectMutation.isPending}
          >
            create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
