import type { ProjectId } from './projects.js';
import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBNote = {
  /**
   * The id of the note.
   */
  id: number;
  /**
   * The path where the note is stored.
   */
  path: string;
  title: string | null;
  description: string | null;
  project_id: ProjectId | null;
  created_at: number;
  updated_at: number;
};

export default class DBNotes {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL UNIQUE,
      title TEXT,
      description TEXT,
      project_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_project ON notes(project_id, path);
    `);
  }

  add(path: string, title: string | null, description: string | null, projectId: ProjectId | null) {
    const stmt = this.db.prepare(`
    INSERT INTO notes (path, title, description, project_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    const now = Date.now();
    const result = stmt.run(path, title, description, projectId, now, now);
    return Number(result.lastInsertRowid);
  }

  getById(id: number): DBNote | null {
    const row = this.db.prepare<[number], DBNote>('SELECT * FROM notes WHERE id = ?').get(id);
    return row ?? null;
  }

  getByPath(path: string): DBNote | null {
    const row = this.db.prepare<[string], DBNote>('SELECT * FROM notes WHERE path = ?').get(path);
    return row ?? null;
  }

  markAsUpdated(id: number): void {
    const now = Date.now();
    const stmt = this.db.prepare<[number, number]>('UPDATE notes SET updated_at = ? WHERE id = ?');
    stmt.run(now, id);
  }

  listWithoutProject(): DBNote[] {
    const rows = this.db
      .prepare<[], DBNote>('SELECT * FROM notes WHERE project_id IS NULL ORDER BY id DESC')
      .all();
    return rows;
  }

  listByProject(projectId: ProjectId): DBNote[] {
    const rows = this.db
      .prepare<[string], DBNote>('SELECT * FROM notes WHERE project_id = ? ORDER BY id DESC')
      .all(projectId);
    return rows;
  }

  deleteByPath(path: string): void {
    const stmt = this.db.prepare('DELETE FROM notes WHERE path = ?');
    stmt.run(path);
  }

  deleteById(id: number): void {
    const stmt = this.db.prepare('DELETE FROM notes WHERE id = ?');
    stmt.run(id);
  }

  deleteByProject(projectId: ProjectId): void {
    const stmt = this.db.prepare<[ProjectId], DBNote>('DELETE FROM notes WHERE project_id = ?');
    stmt.run(projectId);
  }
}
