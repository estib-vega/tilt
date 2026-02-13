import type { JSONObject } from './utils.js';
import { safeParseJson, safeStringifyJson } from './utils.js';
import { type Database as SQLiteDB } from 'better-sqlite3';

export type DBCredential = {
  id: string; // unique id for the credential
  service: string; // e.g. 'github', 'openai', 'tavily', etc
  blob: Buffer<ArrayBufferLike>; // binary blob storing the credential
  metadata: JSONObject | null; // optional metadata
};

type SerializedDBCredential = {
  id: string;
  service: string;
  blob: Buffer<ArrayBufferLike>;
  metadata: string | null;
  created_at: number;
};

export default class DBCredentials {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
			CREATE TABLE IF NOT EXISTS credentials (
				id TEXT NOT NULL PRIMARY KEY,
				service TEXT NOT NULL,
				blob BLOB NOT NULL,
				metadata TEXT,
				created_at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS idx_service ON credentials(service);
		`);
  }

  add(credential: DBCredential): string {
    const createdAt = Date.now();
    const stmt = this.db.prepare(`
			INSERT INTO credentials (id, service, blob, metadata, created_at)
			VALUES (?, ?, ?, ?, ?)
		`);
    stmt.run(
      credential.id,
      credential.service,
      credential.blob,
      credential.metadata ? safeStringifyJson(credential.metadata) : null,
      createdAt,
    );
    return credential.id;
  }

  getByService(service: string): DBCredential[] {
    const rows = this.db
      .prepare<
        string,
        SerializedDBCredential
      >('SELECT * FROM credentials WHERE service = ? ORDER BY created_at ASC')
      .all(service);
    return rows.map((r) => ({
      id: r.id,
      service: r.service,
      blob: r.blob,
      metadata: r.metadata ? safeParseJson<JSONObject>(r.metadata) : null,
    }));
  }

  get(id: string): DBCredential | undefined {
    const row = this.db
      .prepare<string, SerializedDBCredential>('SELECT * FROM credentials WHERE id = ?')
      .get(id);
    if (!row) return undefined;
    return {
      id: row.id,
      service: row.service,
      blob: row.blob,
      metadata: row.metadata ? safeParseJson<JSONObject>(row.metadata) : null,
    };
  }

  getAll(): DBCredential[] {
    const rows = this.db
      .prepare<[], SerializedDBCredential>('SELECT * FROM credentials ORDER BY created_at ASC')
      .all();
    return rows.map((r) => ({
      id: r.id,
      service: r.service,
      blob: r.blob,
      metadata: r.metadata ? safeParseJson<JSONObject>(r.metadata) : null,
    }));
  }

  delete(id: string): number {
    const stmt = this.db.prepare('DELETE FROM credentials WHERE id = ?');
    const info = stmt.run(id);
    return info.changes;
  }

  deleteByService(service: string): number {
    const stmt = this.db.prepare('DELETE FROM credentials WHERE service = ?');
    const info = stmt.run(service);
    return info.changes;
  }
}
