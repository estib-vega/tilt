import type { AssistantContent, AssistantModelMessage, ModelMessage, UserContent } from 'ai';

export function getModelMessageTokenCount(message: ModelMessage): number {
  switch (message.role) {
    case 'system':
      return getTokenEstimate(message.content);
    case 'user':
      return getTokenCountForUserMessage(message.content);
    case 'assistant':
      return getTokenCountForAssistantMessage(message.content);
    case 'tool': {
      let tokenCount = 0;
      for (const part of message.content) {
        switch (part.type) {
          case 'tool-result':
            tokenCount += getTokenEstimate(
              JSON.stringify({
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                output: part.output,
              }),
            );
            break;
          case 'tool-approval-response':
            break;
        }
      }
      return tokenCount;
    }
  }
}

/**
 * Clean the model messages by removing tool calls, tool results, and reasoning parts.
 */
export function cleanModelMessages(messages: ModelMessage[]): ModelMessage[] {
  const cleaned: ModelMessage[] = [];

  for (const message of messages) {
    switch (message.role) {
      case 'system':
        // Skip system message
        break;
      case 'user': {
        cleaned.push(message);
        break;
      }
      case 'assistant': {
        cleaned.push(cleanAsstantModelMessage(message));
        break;
      }
      case 'tool': {
        // Skip tool messages in the cleaned version
        break;
      }
    }
  }
  return cleaned;
}

/**
 * Print the messages in a nice text format.
 *
 * This is intended to be used when passing into prompts for e.g. summarization of a conversation.
 * This gets rid of
 */
export function printModelMessages(messages: ModelMessage[]): string {
  const buffer: string[] = [];

  for (const message of messages) {
    switch (message.role) {
      case 'system':
        // Skip the system message
        break;
      case 'user':
        buffer.push('------------\n');
        buffer.push('USER:\n');
        buffer.push(printUserMessageContent(message.content));
        buffer.push('\n');
        buffer.push('------------\n');
        break;
      case 'assistant':
        buffer.push('------------\n');
        buffer.push('ASSISTANT:\n');
        buffer.push(printAssistantMessageContent(message.content));
        buffer.push('------------\n');
        break;
      case 'tool':
        // Skip tools
        break;
    }
  }

  return buffer.join('');
}

function printAssistantMessageContent(content: AssistantContent): string {
  if (typeof content === 'string') {
    return content;
  }

  const buffer: string[] = [];

  for (const part of content) {
    switch (part.type) {
      case 'text':
        buffer.push(part.text);
        break;
      case 'file':
      case 'reasoning':
      case 'tool-call':
      case 'tool-result':
        // Skip unnecessary generated content
        break;
    }
  }

  return buffer.join('\n');
}

function printUserMessageContent(content: UserContent): string {
  if (typeof content === 'string') {
    return content;
  }

  const buffer: string[] = [];
  for (const part of content) {
    switch (part.type) {
      case 'text':
        buffer.push(part.text);
        break;
      case 'image':
      case 'file':
        // Skip files
        break;
    }
  }

  return buffer.join('\n');
}

function cleanAsstantModelMessage(message: AssistantModelMessage): AssistantModelMessage {
  if (typeof message.content === 'string') {
    return message;
  }

  type AssistantContentPart = Extract<AssistantContent[number], { type: 'text' }>;

  const cleanedContent = message.content.reduce<AssistantContentPart[]>((acc, part) => {
    switch (part.type) {
      case 'text':
        acc.push(part);
        break;
      case 'reasoning':
        // Skip reasoning parts
        break;
      case 'tool-call':
        // Skip tool-call parts
        break;
      case 'tool-result':
        // Skip tool-result parts
        break;
    }
    return acc;
  }, []);

  return {
    ...message,
    content: cleanedContent,
  };
}

const ARBITRARY_IMAGE_TOKEN_COUNT = 50;
const ARBITRARY_FILE_TOKEN_COUNT = 40;

function getTokenCountForAssistantMessage(content: AssistantContent): number {
  if (typeof content === 'string') {
    return getTokenEstimate(content);
  }

  return content.reduce((sum, part) => {
    switch (part.type) {
      case 'text':
        return sum + getTokenEstimate(part.text);
      case 'file':
        return sum + ARBITRARY_FILE_TOKEN_COUNT;
      case 'reasoning':
        return sum + getTokenEstimate(part.text);
      case 'tool-call':
        return (
          sum +
          getTokenEstimate(
            JSON.stringify({
              toolCallId: part.toolCallId,
              toolName: part.toolName,
              input: part.input,
            }),
          )
        );
      case 'tool-result':
        return (
          sum +
          getTokenEstimate(
            JSON.stringify({
              toolCallId: part.toolCallId,
              output: part.output,
            }),
          )
        );
      case 'tool-approval-request':
        return sum;
    }
  }, 0);
}

function getTokenCountForUserMessage(content: UserContent): number {
  if (typeof content === 'string') {
    return getTokenEstimate(content);
  }

  return content.reduce((sum, part) => {
    switch (part.type) {
      case 'text':
        return sum + getTokenEstimate(part.text);
      case 'file':
        return sum + ARBITRARY_FILE_TOKEN_COUNT;
      case 'image':
        return sum + ARBITRARY_IMAGE_TOKEN_COUNT;
    }
  }, 0);
}

function getTokenEstimate(text: string): number {
  return text.length / 4;
}
