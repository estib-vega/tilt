import { Link, useLocation } from '@tanstack/react-router';
import SettingsButton from './SettingsButton';
import { cn } from '@/lib/utils';
import { useListProjects } from '@/model/api/project';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React from 'react';
import { Button } from './ui/button';
import NewProjectModal from './NewProjectModal';
import { useProjectStore } from '@/store';
import type { ProjectId } from '@api/db/tables/projects';

export default function Header() {
  const location = useLocation();
  const isNotesRoute = location.pathname === '/notes';
  const isChatRoute = location.pathname === '/chat';

  return (
    <>
      <header className="[-webkit-app-region:no-drag] p-2 flex items-center gap-4 px-6 pointer-events-auto">
        <React.Suspense>
          <ProjectSelect />
        </React.Suspense>
        <Link
          to="/chat"
          className={cn(
            'text-sm font-medium hover:text-primary transition-colors',
            isChatRoute && 'underline',
          )}
          activeProps={{ className: 'text-primary' }}
        >
          chat
        </Link>
        <Link
          to="/notes"
          className={cn(
            'text-sm font-medium hover:text-primary transition-colors',
            isNotesRoute && 'underline',
          )}
          activeProps={{ className: 'text-primary' }}
        >
          notes
        </Link>

        <SettingsButton />
      </header>
    </>
  );
}

function ProjectSelect() {
  const { data: projects } = useListProjects();
  const projectId = useProjectStore((state) => state.projectId);
  const setProject = useProjectStore((state) => state.setProject);
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const MAIN = 'main';

  const handleValueChange = (value: string) => {
    if (value === MAIN) {
      setProject(null);
      return;
    }
    setProject(value as ProjectId);
  };

  const handleCreateNewProject = () => {
    setSelectOpen(false);
    setDialogOpen(true);
  };

  return (
    <>
      <Select
        value={projectId ?? MAIN}
        onValueChange={handleValueChange}
        open={selectOpen}
        onOpenChange={setSelectOpen}
      >
        <SelectTrigger className="w-full max-w-64">
          <SelectValue placeholder="select project" />
        </SelectTrigger>
        <SelectContent>
          <Button onClick={handleCreateNewProject}>create new project</Button>
          <SelectItem value={MAIN}>
            <p className="text-muted-foreground">(no topic)</p>
          </SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <NewProjectModal open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
