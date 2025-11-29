import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBUIMessage = {
  id: string; //  incoming id
  role: string; // 'user' | 'assistant' | 'system' | etc
  parts: unknown; // serializable content (string, object, array)
  metadata?: unknown; // optional serializable metadata
};

type SerializedDBUIMessage = DBUIMessage & {
  metadata: string | null; // JSON stringified metadata
  parts: string; // JSON stringified parts
  created_at: number;
  idx: number;
};

export default class DBMessages {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT NOT NULL PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      parts TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      idx INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chat ON messages(chat_id, idx);
    `);
  }

  add(chatId: string, message: DBUIMessage, idx?: number): string {
    const id = message.id;
    const createdAt = Date.now();
    // compute idx if not provided
    let useIdx = idx;
    if (useIdx === undefined) {
      const row = this.db
        .prepare<
          string,
          { maxIdx: number | null }
        >('SELECT MAX(idx) as maxIdx FROM messages WHERE chat_id = ?')
        .get(chatId);
      useIdx = (row?.maxIdx ?? -1) + 1;
    }

    const stmt = this.db.prepare(`
    INSERT INTO messages (id, chat_id, role, name, content, metadata, created_at, idx)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(
      id,
      chatId,
      message.role,
      JSON.stringify(message.parts),
      message.metadata ? JSON.stringify(message.metadata) : null,
      createdAt,
      useIdx,
    );
    return id;
  }

  get(chatId: string): DBUIMessage[] {
    const rows = this.db
      .prepare<
        string,
        SerializedDBUIMessage
      >('SELECT * FROM messages WHERE chat_id = ? ORDER BY idx ASC, created_at ASC')
      .all(chatId);

    return rows.map((r) => ({
      id: r.id,
      role: r.role,
      parts: safeParseJson(r.parts),
      metadata: safeParseJson(r.metadata) ?? undefined,
    }));
  }

  deleteMessagesByChat(chatId: string) {
    const stmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?');
    const info = stmt.run(chatId);
    return info.changes;
  }
}

// Helpers
function safeParseJson<T = unknown>(s: string | null): T | null {
  if (s == null) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return s as any;
  }
}
