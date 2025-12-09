import { UIDataTypes, UIMessage, UIMessageChunk, validateUIMessages } from 'ai';
import { Tools } from './ai/tools';
import { isModelIdentifier, ModelIdentifier } from './ai/model.js';
import { UsageUpdate } from './ai/chat';

export type CustomUIMessage = UIMessage<unknown, UIDataTypes, Tools>;

export interface ChatEndEvent {
  id: string;
  text: string;
}

export interface ChatChunkEvent {
  id: string;
  chunk: UIMessageChunk;
}

export interface ChatUsageEvent {
  id: string;
  usage: UsageUpdate;
}

export interface LLMStartParams {
  id: string;
  messages: UIMessage[];
  webSearch: boolean;
  modelIdentifier: ModelIdentifier;
}

export function isLLMStartParams(something: unknown): something is LLMStartParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'id' in something &&
    'messages' in something &&
    'webSearch' in something &&
    typeof (something as any).id === 'string' &&
    Array.isArray((something as any).messages) &&
    typeof (something as any).webSearch === 'boolean' &&
    isModelIdentifier((something as any).modelIdentifier)
  );
}

export interface ChatRequestOptions {
  modelIdentifier: ModelIdentifier;
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
    throw new Error('Invalid LLM start parameters: ' + JSON.stringify(something));
  }
  const { id, messages } = something;
  const validatedMessages = await validateUIMessages({ messages });
  return [
    id,
    validatedMessages,
    { webSearch: something.webSearch, modelIdentifier: something.modelIdentifier },
  ];
}

export interface LLMResumeParams {
  id: string;
  webSearch: boolean;
  modelIdentifier: ModelIdentifier;
}

export function isLLMResumeParams(something: unknown): something is LLMResumeParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'id' in something &&
    'webSearch' in something &&
    typeof (something as any).id === 'string' &&
    typeof (something as any).webSearch === 'boolean' &&
    isModelIdentifier((something as any).modelIdentifier)
  );
}

export function parseLLMResumeParams(something: unknown): LLMResumeParams {
  if (!isLLMResumeParams(something)) {
    throw new Error('Invalid LLM resume parameters');
  }
  return {
    id: something.id,
    webSearch: something.webSearch,
    modelIdentifier: something.modelIdentifier,
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
