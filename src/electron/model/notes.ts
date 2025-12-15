import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const NOTES_DIR = 'notes';

export function newNotePath(appDir: string): string {
  const iso = new Date().toDateString();
  const today = iso.split('T')[0];
  if (!today) {
    // The world is wrong if this happens
    throw new Error('Failed to generate date string for new note path');
  }

  return path.join(appDir, NOTES_DIR, today, createNoteName());
}

function createNoteName(): string {
  return randomUUID() + '.md';
}

export function readNoteContent(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading note content from ${filePath}:`, error);
    return '';
  }
}

export function writeNoteContent(filePath: string, content: string): void {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Error writing note content to ${filePath}:`, error);
  }
}

export function deleteNote(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Error deleting note at ${filePath}:`, error);
  }
}
