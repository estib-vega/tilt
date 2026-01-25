import { type Database as SQLiteDB } from 'better-sqlite3';
import { ProjectId } from './projects';

export type DBUIChat = {
  id: string;
  title: string | null;
  project_id: ProjectId | null;
  created_at: number;
  updated_at: number;
};

export type DBUIChatUpdate = {
  title?: string | null;
  project_id?: ProjectId | null;
};

export default class DBChats {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT NOT NULL PRIMARY KEY,
      title TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    ALTER TABLE chats ADD COLUMN IF NOT EXISTS project_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_chats_project ON chats(project_id, id);
    `);
  }

  create(chat: Omit<DBUIChat, 'created_at' | 'updated_at'>): DBUIChat {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, title, project_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(chat.id, chat.title, chat.project_id, now, now);
    return { ...chat, created_at: now, updated_at: now };
  }

  getById(id: string): DBUIChat | undefined {
    const stmt = this.db.prepare<string, DBUIChat>('SELECT * FROM chats WHERE id = ?');
    return stmt.get(id);
  }

  getAll(): DBUIChat[] {
    const stmt = this.db.prepare<[], DBUIChat>('SELECT * FROM chats ORDER BY updated_at DESC');
    return stmt.all();
  }

  update(id: string, updates: DBUIChatUpdate): DBUIChat | undefined {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE chats
      SET title = COALESCE(?, title),
        project_id = COALESCE(?, project_id),
        updated_at = ?
      WHERE id = ?
    `);
    stmt.run(updates.title, updates.project_id, now, id);
    return this.getById(id);
  }

  chatUpdated(id: string): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE chats
      SET updated_at = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM chats WHERE id = ?');
    stmt.run(id);
  }

  deleteByProject(projectId: ProjectId): void {
    const stmt = this.db.prepare<[ProjectId], DBUIChat>('DELETE FROM chats WHERE project_id = ?');
    stmt.run(projectId);
  }
}
