export function getCommitTitle(message: string): string {
  return message.split("\n")[0];
}

export function getCommitDescription(message: string): string {
  return message.split("\n").slice(1).join("\n");
}
