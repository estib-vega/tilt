import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBUIChat = {
  id: string;
  title: string | null;
  created_at: number;
  updated_at: number;
};

export type DBUIChatUpdate = {
  title?: string | null;
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
    `);
  }

  create(chat: Omit<DBUIChat, 'created_at' | 'updated_at'>): DBUIChat {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO chats (id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(chat.id, chat.title, now, now);
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
          updated_at = ?
      WHERE id = ?
    `);
    stmt.run(updates.title, now, id);
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
}
