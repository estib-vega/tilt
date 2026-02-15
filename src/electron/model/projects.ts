import ButWrapper from './but.js';
import type DB from '@api/db/sqlite.js';
import type { Project, ProjectId } from '@api/db/tables/projects.js';

export default class ProjectsManager {
  private but: ButWrapper | null = null;
  private static instance: ProjectsManager | undefined;
  private constructor(private db: DB) {}

  static getInstance(db: DB): ProjectsManager {
    if (!ProjectsManager.instance) {
      ProjectsManager.instance = new ProjectsManager(db);
    }
    return ProjectsManager.instance;
  }

  private getOrCreateBut(projectId: ProjectId): ButWrapper {
    const projectMeta = this.db.getProjectMeta(projectId);
    const cwd = projectMeta?.repository_path;
    const binaryPath = projectMeta?.but_binary_path;

    if (!cwd) throw new Error('Missing repository path in project metadata');
    if (!binaryPath) throw new Error('Missing but binary path in project metadata');

    if (this.but && this.but.matches(cwd, binaryPath)) return this.but;
    this.but = new ButWrapper(cwd, binaryPath);
    return this.but;
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

  getProject(projectId: ProjectId): Project | null {
    return this.db.getProjectById(projectId);
  }

  getProjectMeta(projectId: ProjectId): ProjectMetadata | null {
    const dbMeta = this.db.getOrCreateProjectMeta(projectId);
    return {
      description: dbMeta.description,
      systemPrompt: dbMeta.system_prompt,
      repositoryPath: dbMeta.repository_path,
      butBinaryPath: dbMeta.but_binary_path,
    };
  }

  updateProjectMeta(projectId: ProjectId, metadata: Partial<ProjectMetadata>): void {
    this.db.updateProjectMeta(projectId, {
      description: metadata.description,
      systemPrompt: metadata.systemPrompt,
    });
  }

  deleteProject(projectId: ProjectId): void {
    this.db.deleteProject(projectId);
  }

  // but commands

  butStatus(projectId: ProjectId) {
    const but = this.getOrCreateBut(projectId);
    return but.status();
  }

  butDiff(projectId: ProjectId, cliId: string) {
    const but = this.getOrCreateBut(projectId);
    return but.diff(cliId);
  }

  checkoutBranch(projectId: ProjectId, branchName: string) {
    const but = this.getOrCreateBut(projectId);
    return but.checkoutBranch(branchName);
  }
}

export type ProjectMetadata = {
  description: string | null;
  systemPrompt: string | null;
  repositoryPath: string | null;
  butBinaryPath: string | null;
};
