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
  project_id: string | null;
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
      project_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_project ON notes(project_id, path);
    `);
  }

  add(path: string, title: string | null, description: string | null, projectId: string | null) {
    const stmt = this.db.prepare(`
    INSERT INTO notes (path, title, description, project_id)
    VALUES (?, ?, ?, ?)
  `);
    const result = stmt.run(path, title, description, projectId);
    return result.lastInsertRowid as number;
  }

  getById(id: number): DBNote | null {
    const row = this.db.prepare<[number], DBNote>('SELECT * FROM notes WHERE id = ?').get(id);
    return row ?? null;
  }

  getByPath(path: string): DBNote | null {
    const row = this.db.prepare<[string], DBNote>('SELECT * FROM notes WHERE path = ?').get(path);
    return row ?? null;
  }

  listWithoutProject(): DBNote[] {
    const rows = this.db
      .prepare<[], DBNote>('SELECT * FROM notes WHERE project_id IS NULL ORDER BY id DESC')
      .all();
    return rows;
  }

  listByProject(projectId: string): DBNote[] {
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
}
