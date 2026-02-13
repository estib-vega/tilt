import { Link, useLocation, useNavigate } from '@tanstack/react-router';
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
import { useProjectsStore } from '@/store';
import type { ProjectId } from '@api/db/tables/projects';
import { getDefaultChatId } from '@/model/api/chat';
import Conditional from './Conditional';

export default function Header() {
  const location = useLocation();
  const projectId = useProjectsStore((state) => state.projectId);
  const isNotesRoute = location.pathname === '/notes';
  const isChatRoute = location.pathname === '/chat';
  const isProjectRoute = location.pathname === '/project';

  return (
    <>
      <header className="w-full flex items-center justify-between">
        <div className="[-webkit-app-region:no-drag] flex items-center pointer-events-auto">
          <React.Suspense>
            <ProjectSelect />
          </React.Suspense>
        </div>
        <div className="[-webkit-app-region:no-drag] flex items-center gap-4 px-6 pointer-events-auto">
          <Conditional condition={projectId !== null}>
            <Link
              to="/project"
              className={cn(
                'text-sm font-medium hover:text-primary transition-colors',
                isProjectRoute && 'underline',
              )}
              activeProps={{ className: 'text-primary' }}
            >
              project
            </Link>
          </Conditional>
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
        </div>
      </header>
    </>
  );
}

function ProjectSelect() {
  const { data: projects } = useListProjects();
  const projectId = useProjectsStore((state) => state.projectId);
  const setProject = useProjectsStore((state) => state.setProject);
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const navigate = useNavigate();

  const MAIN = 'main';

  const handleValueChange = async (value: string) => {
    const newProjectId = value === MAIN ? null : (value as ProjectId);
    setProject(newProjectId);
    const defaultChat = await getDefaultChatId(newProjectId);
    await navigate({ to: '/chat', search: defaultChat ? { chatId: defaultChat } : {} });
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
