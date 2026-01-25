import React from 'react';
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
import { useCreateProjectMutation } from '@/model/api/project';
import { useProjectStore } from '@/store';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectModal(props: NewProjectModalProps) {
  const [projectName, setProjectName] = React.useState('');
  const createProjectMutation = useCreateProjectMutation();
  const setProjectId = useProjectStore((state) => state.setProject);

  const handleCancelCreate = () => {
    props.onOpenChange(false);
    setProjectName('');
  };

  const handleConfirmCreate = async () => {
    const projectId = await createProjectMutation.mutateAsync(projectName.trim());
    setProjectId(projectId);
    props.onOpenChange(false);
    setProjectName('');
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
