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

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewProjectModal(props: NewProjectModalProps) {
  const [projectName, setProjectName] = React.useState('');

  const handleCancelCreate = () => {
    props.onOpenChange(false);
    setProjectName('');
  };

  const handleConfirmCreate = () => {
    // TODO: Implement actual project creation logic
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
          <Button variant="outline" onClick={handleCancelCreate}>
            cancel
          </Button>
          <Button onClick={handleConfirmCreate} disabled={!projectName.trim()}>
            create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
