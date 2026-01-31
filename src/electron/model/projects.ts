import type DB from '@api/db/sqlite';
import type { Project, ProjectId } from '@api/db/tables/projects';

export default class ProjectsManager {
  private static instance: ProjectsManager | undefined;
  private constructor(private db: DB) {}

  static getInstance(db: DB): ProjectsManager {
    if (!ProjectsManager.instance) {
      ProjectsManager.instance = new ProjectsManager(db);
    }
    return ProjectsManager.instance;
  }

  destroy() {
    ProjectsManager.instance = undefined;
  }

  createProject(name: string): ProjectId {
    const id = this.db.createProject(name);
    return id;
  }

  listProjects(): Project[] {
    return this.db.listProjects();
  }

  deleteProject(projectId: ProjectId): void {
    this.db.deleteProject(projectId);
  }
}
