import { type Database as SQLiteDB } from 'better-sqlite3';
import type { JSONArray, JSONObject } from './utils.js';
import { safeParseJson, safeStringifyJson } from './utils.js';

export type DBUIMessage = {
  id: string; //  incoming id
  role: string; // 'user' | 'assistant' | 'system' | etc
  parts: JSONArray; // serializable content (string, object, array)
  metadata?: JSONObject; // optional serializable metadata
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

  exists(chatId: string, messageId: string): boolean {
    const row = this.db
      .prepare<
        [string, string],
        { count: number }
      >('SELECT COUNT(1) as count FROM messages WHERE chat_id = ? AND id = ?')
      .get(chatId, messageId);
    return (row?.count ?? 0) > 0;
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
    INSERT INTO messages (id, chat_id, role, parts, metadata, created_at, idx)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(
      id,
      chatId,
      message.role,
      safeStringifyJson(message.parts),
      message.metadata ? safeStringifyJson(message.metadata) : null,
      createdAt,
      useIdx,
    );
    return id;
  }

  addMultiple(chatId: string, messages: DBUIMessage[]): string[] {
    const stmt = this.db.prepare(`
    INSERT INTO messages (id, chat_id, role, parts, metadata, created_at, idx)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const messageIds: string[] = [];
    let currentIdx =
      this.db
        .prepare<
          string,
          { maxIdx: number | null }
        >('SELECT MAX(idx) as maxIdx FROM messages WHERE chat_id = ?')
        .get(chatId)?.maxIdx ?? null;

    // Use a transaction for bulk insert
    const insertMany = this.db.transaction((msgs: DBUIMessage[]) => {
      for (const message of msgs) {
        const id = message.id;
        const createdAt = Date.now();
        currentIdx = (currentIdx ?? -1) + 1;
        stmt.run(
          id,
          chatId,
          message.role,
          safeStringifyJson(message.parts),
          message.metadata ? safeStringifyJson(message.metadata) : null,
          createdAt,
          currentIdx,
        );
        messageIds.push(id);
      }
    });

    insertMany(messages);

    return messageIds;
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
      parts: safeParseJson<JSONArray>(r.parts) ?? [],
      metadata: safeParseJson<JSONObject>(r.metadata) ?? undefined,
    }));
  }

  deleteMessagesByChat(chatId: string) {
    const stmt = this.db.prepare('DELETE FROM messages WHERE chat_id = ?');
    const info = stmt.run(chatId);
    return info.changes;
  }
}
