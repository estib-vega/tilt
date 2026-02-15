import type { UIMessage } from 'ai';

/**
 * Get the text of the first assistant message found in an array of messages, if any.
 */
export function extractFirstAssistantMessageText(messages: UIMessage[]): string | null {
  for (const message of messages) {
    if (message.role === 'assistant') {
      const content = message.parts
        .map((part) => {
          if (part.type === 'text') {
            return part.text;
          }
        })
        .join('\n');
      return content;
    }
  }
  return null;
}
