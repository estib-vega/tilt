import { UIDataTypes, UIMessage, UIMessageChunk, validateUIMessages } from 'ai';
import { Tools } from './ai/tools';

export type CustomUIMessage = UIMessage<unknown, UIDataTypes, Tools>;

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
  messages: UIMessage[];
  webSerch: boolean;
}

export function isLLMStartParams(something: unknown): something is LLMStartParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'id' in something &&
    'messages' in something &&
    'webSerch' in something &&
    typeof (something as any).id === 'string' &&
    Array.isArray((something as any).messages) &&
    typeof (something as any).webSerch === 'boolean'
  );
}

export interface ChatRequestOptions {
  webSearch: boolean;
}

/**
 * Validate and parse LLM start parameters.
 *
 * Throws an error if validation fails.
 */
export async function parseLLMStartParams(
  something: unknown,
): Promise<[string, UIMessage[], ChatRequestOptions]> {
  if (!isLLMStartParams(something)) {
    throw new Error('Invalid LLM start parameters');
  }
  const { id, messages } = something;
  const validatedMessages = await validateUIMessages({ messages });
  return [id, validatedMessages, { webSearch: something.webSerch }];
}

export interface UIChat {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface UIChatTitleUpdateEvent {
  id: string;
  title: string | null;
}

export interface UpdateChatTitleParams {
  chatId: string;
  title: string;
}
