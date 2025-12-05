import { UIDataTypes, UIMessage, UIMessageChunk, validateUIMessages } from 'ai';
import { Tools } from './ai/tools';
import { isModelProvider, Model, ModelId } from './ai/model.js';

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

export interface LLMResumeParams {
  id: string;
  webSerch: boolean;
}

export function isLLMResumeParams(something: unknown): something is LLMResumeParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'id' in something &&
    'webSerch' in something &&
    typeof (something as any).id === 'string' &&
    typeof (something as any).webSerch === 'boolean'
  );
}

export function parseLLMResumeParams(something: unknown): LLMResumeParams {
  if (!isLLMResumeParams(something)) {
    throw new Error('Invalid LLM resume parameters');
  }
  return {
    id: something.id,
    webSerch: something.webSerch,
  };
}

export interface LLMCreateChatParams {
  initialMessages?: UIMessage[];
}

function isLLMCreateChatParams(something: unknown): something is LLMCreateChatParams {
  if (typeof something !== 'object' || something === null) {
    return false;
  }
  const maybeInitialMessages = (something as any).initialMessages;
  if (maybeInitialMessages === undefined) {
    return true;
  }
  if (!Array.isArray(maybeInitialMessages)) {
    return false;
  }
  return true;
}

export async function parseLLMCreateChatParams(
  something: unknown,
): Promise<[UIMessage[] | undefined]> {
  if (!isLLMCreateChatParams(something)) {
    throw new Error('Invalid LLM create parameters');
  }
  const { initialMessages } = something;
  if (initialMessages && initialMessages.length > 0) {
    return validateUIMessages({ messages: initialMessages }).then((msgs) => [msgs]);
  }
  return [undefined];
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

export interface CreateModelRequest {
  model: Model;
}

export function isModel(something: unknown): something is Model {
  if (typeof something !== 'object' || something === null) {
    return false;
  }
  if (
    typeof (something as any).provider !== 'string' ||
    !isModelProvider((something as any).provider)
  ) {
    return false;
  }
  if (typeof (something as any).name !== 'string') {
    return false;
  }
  if ((something as any).apiKey !== null && typeof (something as any).apiKey !== 'string') {
    return false;
  }
  if ((something as any).baseUrl !== null && typeof (something as any).baseUrl !== 'string') {
    return false;
  }
  return true;
}

export function isCreateModelRequest(something: unknown): something is CreateModelRequest {
  if (typeof something !== 'object' || something === null) {
    return false;
  }
  return isModel((something as any).model);
}

export interface DeleteModelRequest {
  modelId: ModelId;
}
