import type { LanguageModelUsage, UIDataTypes, UIMessage, UIMessageChunk } from 'ai';
import { validateUIMessages } from 'ai';
import type { Tools } from './ai/tools.js';
import type { ModelIdentifier, ModelProvider } from './ai/model.js';
import { isModelIdentifier } from './ai/model.js';
import type { CredentialService } from './model/credentials.js';
import { isCredentialService } from './model/credentials.js';
import z from 'zod';
import type { WebSearchEvent } from './ai/webSearch.js';
import type { ProjectId } from './db/tables/projects.js';
import { ProjectIdSchema } from './db/tables/projects.js';

export type CustomUIMessage = UIMessage<unknown, UIDataTypes, Tools>;

export const ListChatsParamsSchema = z.object({
  projectId: ProjectIdSchema.nullable(),
});

export type ListChatsParams = z.infer<typeof ListChatsParamsSchema>;

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
  projectId: ProjectId | null;
  initialMessages?: UIMessage[];
}

function isLLMCreateChatParams(something: unknown): something is LLMCreateChatParams {
  if (typeof something !== 'object' || something === null) {
    return false;
  }

  if (
    (something as any).projectId !== null &&
    !ProjectIdSchema.safeParse((something as any).projectId).success
  ) {
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
): Promise<[UIMessage[] | undefined, ProjectId | null]> {
  if (!isLLMCreateChatParams(something)) {
    throw new Error('Invalid LLM create parameters');
  }
  const { initialMessages, projectId } = something;
  if (initialMessages && initialMessages.length > 0) {
    const messages = await validateUIMessages({ messages: initialMessages });
    return [messages, projectId];
  }
  return [undefined, projectId];
}

export interface UIChat {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
}

export type UsageUpdate = {
  chatId: string;
  id: string;
  name: string;
  provider: ModelProvider;
  usage: LanguageModelUsage;
};

interface BaseUIChatEvent {
  type: 'title-updated' | 'tool-update';
  /**
   * The chat ID associated with this event.
   */
  id: string;
}

export interface UIChatTitleUpdateEvent extends BaseUIChatEvent {
  type: 'title-updated';
  title: string | null;
}

interface BaseChatToolUpdateEvent {
  tool: 'web-search';
  callId: string;
}

export interface UIChatWebSearchToolUpdateEvent extends BaseChatToolUpdateEvent {
  tool: 'web-search';
  event: WebSearchEvent;
}

export type UIChatToolUpdateEventContent = UIChatWebSearchToolUpdateEvent;

export interface UIChatToolUpdateEvent extends BaseUIChatEvent {
  type: 'tool-update';
  event: UIChatToolUpdateEventContent;
}

export type UIChatEvent = UIChatTitleUpdateEvent | UIChatToolUpdateEvent;

export interface UpdateChatTitleParams {
  chatId: string;
  title: string;
}

export interface AddCredentialParams {
  service: CredentialService;
  secret: string;
}

function isAddCredentialParams(something: unknown): something is AddCredentialParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'service' in something &&
    'secret' in something &&
    typeof (something as any).secret === 'string' &&
    isCredentialService((something as any).service)
  );
}

export function parseAddCredentialParams(something: unknown): AddCredentialParams {
  if (!isAddCredentialParams(something)) {
    throw new Error('Invalid add credential parameters');
  }
  return something;
}

export interface DeleteCredentialParams {
  id: string;
}

function isDeleteCredentialParams(something: unknown): something is DeleteCredentialParams {
  return (
    typeof something === 'object' &&
    something !== null &&
    'id' in something &&
    typeof (something as any).id === 'string'
  );
}

export function parseDeleteCredentialParams(something: unknown): DeleteCredentialParams {
  if (!isDeleteCredentialParams(something)) {
    throw new Error('Invalid delete credential parameters');
  }
  return something;
}

export const ListNotesParamsSchema = z.object({
  projectId: ProjectIdSchema.nullable(),
});

export type ListNotesParams = z.infer<typeof ListNotesParamsSchema>;

export const NewNoteParamsSchema = z.object({
  projectId: ProjectIdSchema.nullable(),
  content: z.string(),
});

export type NewNoteParams = z.infer<typeof NewNoteParamsSchema>;

export const ReadNoteParamsSchema = z.object({
  id: z.number(),
});

export type ReadNoteParams = z.infer<typeof ReadNoteParamsSchema>;

export const WriteNoteParamsSchema = z.object({
  id: z.number(),
  content: z.string(),
});

export type WriteNoteParams = z.infer<typeof WriteNoteParamsSchema>;

export const DeleteNoteParamsSchema = z.object({
  id: z.number(),
});

export type DeleteNoteParams = z.infer<typeof DeleteNoteParamsSchema>;

export const CreateProjectParamsSchema = z.object({
  name: z.string(),
});

export type CreateProjectParams = z.infer<typeof CreateProjectParamsSchema>;

export const DeleteProjectParamsSchema = z.object({
  projectId: ProjectIdSchema,
});

export type DeleteProjectParams = z.infer<typeof DeleteProjectParamsSchema>;

export const GetProjectParamsSchema = z.object({
  projectId: ProjectIdSchema,
});

export type GetProjectParams = z.infer<typeof GetProjectParamsSchema>;

export const GetProjectMetaParamsSchema = z.object({
  projectId: ProjectIdSchema,
});

export type GetProjectMetaParams = z.infer<typeof GetProjectMetaParamsSchema>;

export const UpdateProjectMetaParamsSchema = z.object({
  projectId: ProjectIdSchema,
  metadata: z.object({
    description: z.string().nullable().optional(),
    systemPrompt: z.string().nullable().optional(),
  }),
});

export type UpdateProjectMetaParams = z.infer<typeof UpdateProjectMetaParamsSchema>;

export const ButStatusParamsSchema = z.object({
  cwd: z.string(),
  binaryPath: z.string(),
});

export type ButStatusParams = z.infer<typeof ButStatusParamsSchema>;
