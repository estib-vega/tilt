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
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleValueChange = (value: string) => {
    setSelectedProject(value);
  };

  const handleCreateNewProject = () => {
    setSelectOpen(false);
    setDialogOpen(true);
  };

  return (
    <>
      <Select
        value={selectedProject}
        onValueChange={handleValueChange}
        open={selectOpen}
        onOpenChange={setSelectOpen}
      >
        <SelectTrigger>
          <SelectValue placeholder="select project" />
        </SelectTrigger>
        <SelectContent>
          <Button onClick={handleCreateNewProject}>create new project</Button>
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
