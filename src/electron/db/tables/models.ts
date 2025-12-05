import { type Database as SQLiteDB } from 'better-sqlite3';
import { JSONObject, safeParseJson, safeStringifyJson } from './utils.js';

export type DBModel = {
  id: number;
  provider: string;
  name: string;
  /**
   * Encrypted API key as byte array.
   */
  api_key: Buffer<ArrayBufferLike> | null;
  base_url: string | null;
  /**
   * JSON stringifiable.
   */
  parameters: JSONObject | null;
  created_at: number;
  updated_at: number;
};

type SerializedDBModel = DBModel & {
  parameters: string | null; // JSON stringified parameters
};

export default class DBModels {
  constructor(private db: SQLiteDB) {
    // Create table if it doesn't exist
    this.db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key BLOB,
      base_url TEXT,
      parameters TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_model_provider_name ON models(provider, name);
    `);
  }

  create(model: Omit<DBModel, 'id' | 'created_at' | 'updated_at'>): DBModel {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO models (provider, name, api_key, base_url, parameters, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      model.provider,
      model.name,
      model.api_key,
      model.base_url,
      model.parameters ? safeStringifyJson(model.parameters) : null,
      now,
      now,
    );

    return {
      id: Number(result.lastInsertRowid),
      ...model,
      created_at: now,
      updated_at: now,
    };
  }

  getById(id: number): DBModel | null {
    const stmt = this.db.prepare<number, SerializedDBModel>('SELECT * FROM models WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return {
      ...row,
      parameters: row.parameters ? safeParseJson(row.parameters) : null,
    };
  }

  getAll(): DBModel[] {
    const stmt = this.db.prepare<[], SerializedDBModel>('SELECT * FROM models');
    const rows = stmt.all();

    return rows.map((row) => ({
      ...row,
      parameters: row.parameters ? safeParseJson(row.parameters) : null,
    }));
  }

  update(
    id: number,
    model: Partial<Omit<DBModel, 'id' | 'created_at' | 'updated_at'>>,
  ): DBModel | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE models
      SET provider = ?, name = ?, api_key = ?, base_url = ?, parameters = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      model.provider ?? existing.provider,
      model.name ?? existing.name,
      model.api_key !== undefined ? model.api_key : existing.api_key,
      model.base_url !== undefined ? model.base_url : existing.base_url,
      model.parameters !== undefined
        ? model.parameters
          ? safeStringifyJson(model.parameters)
          : null
        : existing.parameters
          ? safeStringifyJson(existing.parameters)
          : null,
      now,
      id,
    );

    return this.getById(id);
  }

  delete(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM models WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
