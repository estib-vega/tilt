import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBChatSummary = {
  /**
   * The ID of the chat being summarized.
   */
  chat_id: string;
  /**
   * The summary text.
   */
  summary: string;
  /**
   * The ID of the last message summarized.
   */
  last_message_id: string;
  created_at: number;
  updated_at: number;
};

export default class DBChatSummaries {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS chat_summaries (
      chat_id TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      last_message_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    `);
  }

  /**
   * Create or update a chat summary.
   */
  upsert(summary: Omit<DBChatSummary, 'created_at' | 'updated_at'>): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO chat_summaries (chat_id, summary, last_message_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        summary = excluded.summary,
        last_message_id = excluded.last_message_id,
        updated_at = excluded.updated_at
     `);
    stmt.run(summary.chat_id, summary.summary, summary.last_message_id, now, now);
  }

  /**
   * Get a chat summary by chat ID.
   */
  getByChatId(chatId: string): DBChatSummary | undefined {
    const stmt = this.db.prepare<string, DBChatSummary>(`
      SELECT * FROM chat_summaries WHERE chat_id = ?
     `);
    return stmt.get(chatId);
  }

  /**
   * Get all chat summaries.
   */
  getAll(): DBChatSummary[] {
    const stmt = this.db.prepare<[], DBChatSummary>(`
      SELECT * FROM chat_summaries ORDER BY updated_at DESC
     `);
    return stmt.all();
  }

  /**
   * Delete a chat summary by chat ID.
   */
  delete(chatId: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM chat_summaries WHERE chat_id = ?
     `);
    stmt.run(chatId);
  }

  /**
   * Delete all chat summaries.
   */
  deleteAll(): void {
    this.db.exec(`DELETE FROM chat_summaries`);
  }
}
