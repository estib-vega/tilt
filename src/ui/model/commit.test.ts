import { parseCommitMessage } from './commit';
import { describe, it, expect } from 'vitest';

describe('parseCommitMessage', () => {
  it('should parse a simple commit message with title only', () => {
    const message = 'feat: add new feature';
    const result = parseCommitMessage(message);

    expect(result.title).toBe('feat: add new feature');
    expect(result.description).toBe('');
  });

  it('should parse commit message with title and description', () => {
    const message = `feat: add new feature

This is a detailed description
of the feature that was added`;

    const result = parseCommitMessage(message);

    expect(result.title).toBe('feat: add new feature');
    expect(result.description).toBe(
      'This is a detailed description\nof the feature that was added',
    );
  });

  it('should skip empty lines before description', () => {
    const message = `fix: bug fix


This is the description`;

    const result = parseCommitMessage(message);

    expect(result.title).toBe('fix: bug fix');
    expect(result.description).toBe('This is the description');
  });

  it('should preserve empty lines after first non-empty description line', () => {
    const message = `feat: new feature

First line of description

Second line after empty line`;

    const result = parseCommitMessage(message);

    expect(result.title).toBe('feat: new feature');
    expect(result.description).toBe('First line of description\n\nSecond line after empty line');
  });

  it('should handle multiline description with multiple paragraphs', () => {
    const message = `refactor: restructure code

This is the first paragraph
with multiple lines.

This is the second paragraph
also with multiple lines.`;

    const result = parseCommitMessage(message);

    expect(result.title).toBe('refactor: restructure code');
    expect(result.description).toBe(
      'This is the first paragraph\nwith multiple lines.\n\nThis is the second paragraph\nalso with multiple lines.',
    );
  });

  it('should handle commit with no description and trailing newlines', () => {
    const message = 'chore: update dependencies\n\n\n';
    const result = parseCommitMessage(message);

    expect(result.title).toBe('chore: update dependencies');
    expect(result.description).toBe('');
  });

  it('should handle empty string', () => {
    const message = '';
    const result = parseCommitMessage(message);

    expect(result.title).toBe('');
    expect(result.description).toBe('');
  });

  it('should handle message with only newlines', () => {
    const message = '\n\n\n';
    const result = parseCommitMessage(message);

    expect(result.title).toBe('');
    expect(result.description).toBe('');
  });
});
