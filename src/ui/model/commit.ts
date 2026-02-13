export interface CommitMessage {
  title: string;
  description: string;
}

export function parseCommitMessage(message: string): CommitMessage {
  const [title, ...rest] = message.split('\n');
  let description = '';
  let foundNonEmptyLine = false;
  let counter = 0;
  let lastIndex = rest.length - 1;

  for (const line of rest) {
    if (foundNonEmptyLine) {
      description += line;
      if (lastIndex !== counter) description += '\n';
      counter++;
      continue;
    }

    if (line.trim() === '') {
      counter++;
      continue;
    }

    foundNonEmptyLine = true;
    description += line;
    if (lastIndex !== counter) description += '\n';
    counter++;
  }

  return {
    title,
    description,
  };
}
