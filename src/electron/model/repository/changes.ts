import type { JsonChange } from '../but.js';

export function stringifyJsonChanges(changes: JsonChange[]): string {
  let buffer: string[] = [];
  for (const change of changes) {
    buffer.push(stringifyJsonChange(change));
  }
  return buffer.join('\n\n');
}

function stringifyJsonChange(change: JsonChange): string {
  let result = '**file path**: ' + change.path;
  result += '\n';
  result += '**status**: ' + change.status;
  if (change.oldPath) {
    result += '\n';
    result += '**old file path**: ' + change.oldPath;
  }
  result += '\n';

  switch (change.diff.type) {
    case 'binary': {
      result += '**content**: -- no content, binary file --';
      return result;
    }
    case 'tooLarge': {
      result += '**content**: -- no content, file too big --';
      return result;
    }
    case 'patch': {
      result += '**content**:';
      for (const hunk of change.diff.hunks) {
        result += '\n';
        result += '```';
        result += '\n';
        result += hunk.diff;
        result += '\n';
        result += '```';
      }
      return result;
    }
  }
}
