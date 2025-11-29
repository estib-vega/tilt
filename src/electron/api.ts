import { UIMessage, UIMessageChunk, validateUIMessages } from 'ai';

export interface ChatEndEvent {
  id: string;
  text: string;
}

export interface ChatChunkEvent {
  id: string;
  chunk: UIMessageChunk;
}

export interface LLMStartParams {
  id: string;
  messages: Record<string, unknown>[];
}

export function isLLMStartParams(something: unknown): something is LLMStartParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'id' in something &&
    'messages' in something &&
    typeof (something as any).id === 'string' &&
    Array.isArray((something as any).messages)
  );
}

/**
 * Validate and parse LLM start parameters.
 *
 * Throws an error if validation fails.
 */
export async function parseLLMStartParams(something: unknown): Promise<[string, UIMessage[]]> {
  if (!isLLMStartParams(something)) {
    throw new Error('Invalid LLM start parameters');
  }
  const { id, messages } = something;
  const validatedMessages = await validateUIMessages({ messages });
  return [id, validatedMessages];
}

export interface UIChat {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface UpdateChatTitleParams {
  chatId: string;
  title: string;
}
