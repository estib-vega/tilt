import type { ProjectId } from './projects.js';
import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBProjectMeta = {
  /**
   * The id of the project meta.
   *
   */
  id: number;
  /**
   * The project id this meta belongs to.
   */
  project_id: ProjectId;
  /**
   * The description of the project.
   */
  description: string | null;
  /**
   * The system prompt to use for the project.
   */
  system_prompt: string | null;
  /**
   * The path to the associated repository.
   */
  repository_path: string | null;
  /**
   * The path of the but binary to use.
   */
  but_binary_path: string | null;
  created_at: number;
  updated_at: number;
};

export default class DBProjectMetas {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS project_metas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL UNIQUE,
      description TEXT,
      system_prompt TEXT,
      repository_path TEXT,
      but_binary_path TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_project_metas_project ON project_metas(project_id, id);
    `);
  }

  create(meta: Omit<DBProjectMeta, 'id' | 'created_at' | 'updated_at'>): DBProjectMeta {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO project_metas (project_id, description, system_prompt, repository_path, but_binary_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      meta.project_id,
      meta.description,
      meta.system_prompt,
      meta.repository_path,
      meta.but_binary_path,
      now,
      now,
    );
    return { ...meta, id: result.lastInsertRowid as number, created_at: now, updated_at: now };
  }

  getById(id: number): DBProjectMeta | undefined {
    const stmt = this.db.prepare<number, DBProjectMeta>('SELECT * FROM project_metas WHERE id = ?');
    return stmt.get(id);
  }

  getByProjectId(projectId: ProjectId): DBProjectMeta | undefined {
    const stmt = this.db.prepare<[ProjectId], DBProjectMeta>(
      'SELECT * FROM project_metas WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
    );
    return stmt.get(projectId);
  }

  update(
    id: number,
    updates: Partial<Omit<DBProjectMeta, 'id' | 'project_id' | 'created_at' | 'updated_at'>>,
  ): DBProjectMeta | undefined {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE project_metas
      SET description = COALESCE(?, description),
        system_prompt = COALESCE(?, system_prompt),
        repository_path = COALESCE(?, repository_path),
        but_binary_path = COALESCE(?, but_binary_path),
        updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      updates.description,
      updates.system_prompt,
      updates.repository_path,
      updates.but_binary_path,
      now,
      id,
    );
    return this.getById(id);
  }

  delete(id: number): void {
    const stmt = this.db.prepare('DELETE FROM project_metas WHERE id = ?');
    stmt.run(id);
  }

  deleteByProject(projectId: ProjectId): void {
    const stmt = this.db.prepare<[ProjectId], DBProjectMeta>(
      'DELETE FROM project_metas WHERE project_id = ?',
    );
    stmt.run(projectId);
  }
}
