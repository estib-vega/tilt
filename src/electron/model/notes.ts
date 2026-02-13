import type DB from '@api/db/sqlite.js';
import type { ProjectId } from '@api/db/tables/projects.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const NOTES_DIR = 'notes';

export default class NotesManager {
  private static instance: NotesManager | undefined;
  private constructor(
    private appDir: string,
    private db: DB,
  ) {}

  static getInstance(appDir: string, db: DB): NotesManager {
    if (!NotesManager.instance) {
      NotesManager.instance = new NotesManager(appDir, db);
    }
    return NotesManager.instance;
  }

  destroy() {
    NotesManager.instance = undefined;
  }

  newNotePath(projectId: ProjectId | null): string {
    const iso = new Date().toDateString();
    const today = iso.split('T')[0];
    if (!today) {
      // The world is wrong if this happens
      throw new Error('Failed to generate date string for new note path');
    }

    if (projectId) {
      return path.join(this.appDir, NOTES_DIR, projectId, today, this.createNoteName());
    }

    return path.join(this.appDir, NOTES_DIR, today, this.createNoteName());
  }

  private createNoteName(): string {
    return randomUUID() + '.md';
  }

  listNotes(projectId: ProjectId | null): Note[] {
    const notes = this.db.listNotes(projectId);
    return notes.map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
    }));
  }

  getPathForNoteId(noteId: number): string {
    const note = this.db.getNoteById(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    return note.path;
  }

  getProjectForNoteId(noteId: number): ProjectId | null {
    const note = this.db.getNoteById(noteId);
    if (!note) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
    return note.project_id;
  }

  getIdForNotePath(filePath: string): number | null {
    const note = this.db.getNoteByPath(filePath);
    return note ? note.id : null;
  }

  readNoteContent(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
      return content;
    } catch (error) {
      console.error(`Error reading note content from ${filePath}:`, error);
      return '';
    }
  }

  writeNoteContent(projectId: ProjectId | null, filePath: string, content: string): void {
    let isFirstWrite = false;
    try {
      const dir = path.dirname(filePath);

      // Ensure the file exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (!fs.existsSync(filePath)) {
        isFirstWrite = true;
      }

      fs.writeFileSync(filePath, content, 'utf-8');

      if (isFirstWrite) {
        const title = this.getInitialTitle(content);
        this.db.createNote(filePath, title, null, projectId);
      }
    } catch (error) {
      console.error(`Error writing note content to ${filePath}:`, error);
    }
  }

  private getInitialTitle(content: string): string | null {
    const lines = content.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        return trimmed.length <= 100 ? trimmed : trimmed.slice(0, 100);
      }
    }
    return null;
  }

  deleteNote(filePath: string): void {
    try {
      fs.unlinkSync(filePath);
      this.db.deleteNoteByPath(filePath);
    } catch (error) {
      console.error(`Error deleting note at ${filePath}:`, error);
    }
  }
}

export interface Note {
  id: number;
  title: string | null;
  description: string | null;
}
