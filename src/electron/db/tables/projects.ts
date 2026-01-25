import { z } from 'zod';
import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBProject = {
  /**
   * The id of the project.
   *
   */
  id: number;
  /**
   * The name of the project.
   */
  name: string;
  created_at: number;
  updated_at: number;
};

export type Project = {
  id: ProjectId;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export default class DBProjects {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    `);
  }

  add(name: string): ProjectId {
    const stmt = this.db.prepare<[string, number, number], DBProject>(`
    INSERT INTO projects (name, created_at, updated_at)
    VALUES (?, ?, ?)
  `);
    const now = Date.now();
    const result = stmt.run(name, now, now);
    const id = Number(result.lastInsertRowid);
    return createProjectId(id);
  }

  getById(projectId: ProjectId): Project | null {
    const id = parseProjectId(projectId);
    const row = this.db.prepare<[number], DBProject>('SELECT * FROM projects WHERE id = ?').get(id);
    return row ? mapDBProjectToProject(row) : null;
  }

  getAll(): Project[] {
    const rows = this.db.prepare<[], DBProject>('SELECT * FROM projects ORDER BY id DESC').all();
    return rows.map(mapDBProjectToProject);
  }

  markAsUpdated(projectId: ProjectId): void {
    const id = parseProjectId(projectId);
    const now = Date.now();
    const stmt = this.db.prepare<[number, number]>(
      'UPDATE projects SET updated_at = ? WHERE id = ?',
    );
    stmt.run(now, id);
  }

  deleteById(projectId: ProjectId): void {
    const id = parseProjectId(projectId);
    const stmt = this.db.prepare<[number], DBProject>('DELETE FROM projects WHERE id = ?');
    stmt.run(id);
  }
}

export const ProjectIdSchema = z.string().brand<'ProjectId'>();
export type ProjectId = z.infer<typeof ProjectIdSchema>;

function createProjectId(id: number): ProjectId {
  const projectId = `project_${id}`;
  return projectId as ProjectId;
}

function parseProjectId(projectId: ProjectId): number {
  const idStr = projectId.replace('project_', '');
  return Number(idStr);
}

function mapDBProjectToProject(dbProject: DBProject): Project {
  return {
    id: createProjectId(dbProject.id),
    name: dbProject.name,
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
  };
}
