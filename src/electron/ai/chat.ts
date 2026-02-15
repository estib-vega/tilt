import { getModel } from './model.js';
import WebSearch from './webSearch.js';
import type { AllTools } from './tools.js';
import { generateTools } from './tools.js';
import { getModelMessageTokenCount } from './context.js';
import {
  promptForCondensedConversation,
  systemPromptForChat,
  systemPromptForCondensedConversation,
  systemPromptForContinuedConversation,
  systemPromptForReviewChat,
} from './prompt.js';
import type { DBUIMessage } from '@api/db/tables/messages.js';
import {
  streamText,
  convertToModelMessages,
  generateText,
  createIdGenerator,
  stepCountIs,
  safeValidateUIMessages,
} from 'ai';
import type { UIMessage, UIMessageChunk, PrepareStepResult, LanguageModel } from 'ai';
import type DB from '@api/db/sqlite.js';
import type {
  ChatRequestOptions,
  ReviewChatRequestOptions,
  UIChat,
  UIChatEvent,
  UsageUpdate,
} from '@api/api.js';
import type CredentialsManager from '@api/model/credentials.js';
import type Navigator from '@api/model/navigator/index.js';
import type { ProjectId } from '@api/db/tables/projects.js';

type ChatEventListner = (event: UIChatEvent) => void;

export default class ChatManager {
  private static instance: ChatManager | undefined;
  private activeControllers = new Map<string, AbortController>(); // id → abortController
  private chatEventListeners: Set<ChatEventListner> = new Set();

  private constructor(
    private db: DB,
    private credentialsManager: CredentialsManager,
    private navigator: Navigator,
  ) {
    // Private constructor to enforce singleton pattern
    this.activeControllers = new Map();
    this.chatEventListeners = new Set();
  }

  addChatEventListener(listener: ChatEventListner): void {
    this.chatEventListeners.add(listener);
  }

  private notifyChatEvent(event: UIChatEvent): void {
    for (const listener of this.chatEventListeners) {
      listener(event);
    }
  }

  /**
   * Update the title of a chat in the database.
   */
  updateChatTitle(chatId: string, title: string): UIChat {
    const chat = this.db.updateChatTitle(chatId, title);
    this.notifyChatEvent({ type: 'title-updated', id: chat.id, title: chat.title });
    return {
      id: chat.id,
      title: chat.title,
      createdAt: chat.created_at,
      updatedAt: chat.updated_at,
    };
  }

  /**
   * Create a new chat in the database.
   */
  createChat(projectId: ProjectId | null, initialMessages?: UIMessage[]): string {
    const chatId = this.db.createChat(projectId);
    if (initialMessages && initialMessages.length > 0) {
      // TODO: ensuere messages are serializable
      this.db.addMessagesToChat(chatId, initialMessages as DBUIMessage[]);
    }
    return chatId;
  }

  /**
   * Delete a chat from the database.
   */
  deleteChat(chatId: string): void {
    this.db.deleteChat(chatId);
  }

  /**
   * List all chats from the database.
   */
  listChats(projectId: ProjectId | null): UIChat[] {
    return this.db.listChats(projectId).map(
      (dbChat): UIChat => ({
        id: dbChat.id,
        title: dbChat.title,
        createdAt: dbChat.created_at,
        updatedAt: dbChat.updated_at,
      }),
    );
  }

  /**
   * Get all messages for a chat from the database.
   */
  async getChatMessages(chatId: string): Promise<UIMessage[]> {
    const messages = this.db.getMessagesForChat(chatId).map(
      (dbMessage): UIMessage => ({
        id: dbMessage.id,
        role: dbMessage.role as UIMessage['role'],
        parts: dbMessage.parts as UIMessage['parts'],
        metadata: dbMessage.metadata,
      }),
    );

    if (messages.length === 0) {
      // skip validation if there are no messages
      return messages;
    }

    const result = await safeValidateUIMessages({ messages });

    if (!result.success) {
      throw new Error(`Invalid messages for chat ${chatId}: ${result.error}`);
    }

    return result.data;
  }

  private getSystemPromptForChat(chatId: string): string {
    const projectMeta = this.db.getProjectMetaForChat(chatId);
    return systemPromptForChat(projectMeta);
  }

  private getSystemPromptForReviewChat(projectId: ProjectId, diffSummary: string | null) {
    const projectMeta = this.db.getProjectMeta(projectId);
    return systemPromptForReviewChat(projectMeta, diffSummary);
  }

  /**
   * Streams a chat response from the AI model based on the provided messages.
   */
  async chat(
    chatId: string,
    messages: UIMessage[],
    options: ChatRequestOptions,
    onUpdate: (chunk: UIMessageChunk) => void,
    onUsage: (usage: UsageUpdate) => void,
  ): Promise<string> {
    const abortSignal = this.getAbortControllerSignal(chatId);
    const modelMessages = await convertToModelMessages(messages);

    const lastIdx = messages.length - 1;
    if (lastIdx >= 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'user') {
        // This signals that there is a chat session
        // is resuming, so we don't need to trigger generation again.
        return '';
      }

      // TODO: ensure that lastMessage is serializable
      this.db.addMessageToChat(chatId, lastMessage as DBUIMessage, lastIdx);
    }

    this.ensureChatHasTitle(chatId, messages[0]).catch((err) => {
      console.error('Chat: Failed to ensure chat has title:', err);
    });

    const model = getModel(options.modelIdentifier, this.credentialsManager);

    // Instantiate WebSearch with event emitter
    const webSearch = this.createWebSearch(model, chatId);

    const streamResponse = streamText({
      system: this.getSystemPromptForChat(chatId),
      model: model,
      messages: modelMessages,
      tools: generateTools({
        useWebSearch: options.webSearch,
        webSearch,
      }),
      prepareStep: () => this.prepareStep(chatId, messages, 30_000),
      stopWhen: stepCountIs(15),
      abortSignal,
    });

    const stream = streamResponse.toUIMessageStream({
      originalMessages: messages,
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),
      onFinish: ({ responseMessage }) => {
        // TODO: ensure that the response message is serializable
        this.db.addMessageToChat(chatId, responseMessage as DBUIMessage, lastIdx + 1);
      },
    });

    for await (const chunk of stream) {
      onUpdate(chunk);
    }

    // Emit usage info
    streamResponse.usage.then((usage) => {
      onUsage({
        chatId,
        id: model.modelId,
        name: options.modelIdentifier.name,
        provider: options.modelIdentifier.provider,
        usage,
      });
    });

    return streamResponse.text;
  }

  async reviewChat(
    projectId: ProjectId,
    diffSummary: string | null,
    messages: UIMessage[],
    options: ReviewChatRequestOptions,
    onUpdate: (chunk: UIMessageChunk) => void,
  ): Promise<string> {
    const modelMessages = await convertToModelMessages(messages);
    const model = getModel(options.modelIdentifier, this.credentialsManager);

    const streamResponse = streamText({
      system: this.getSystemPromptForReviewChat(projectId, diffSummary),
      model,
      messages: modelMessages,
    });

    const stream = streamResponse.toUIMessageStream({
      originalMessages: messages,
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),
    });

    for await (const chunk of stream) {
      onUpdate(chunk);
    }

    return streamResponse.text;
  }

  /**
   * Initialize a WebSearch instance with event handling for chat updates.
   */
  private createWebSearch(model: LanguageModel, chatId: string) {
    return new WebSearch(this.navigator, model, (callId, event) => {
      this.notifyChatEvent({
        type: 'tool-update',
        id: chatId,
        event: {
          tool: 'web-search',
          callId,
          event,
        },
      });
    });
  }

  /**
   * Prepare the next step in the chat by condensing messages if needed.
   */
  private async prepareStep(
    chatId: string,
    messages: UIMessage[],
    threshold: number,
  ): Promise<PrepareStepResult<AllTools>> {
    const previousSummary = this.db.getChatSummary(chatId);

    // No previous summary, do full condensation
    if (!previousSummary) {
      return this.condenseMessages(chatId, messages, undefined, threshold);
    }

    // There is a previous summary, do a continued condensation
    const lastMessageIndex = messages.findIndex(
      (msg) => msg.id === previousSummary.last_message_id,
    );
    if (lastMessageIndex === -1 || lastMessageIndex === messages.length - 1) {
      // No new messages to summarize
      return undefined;
    }
    const newMessages = messages.slice(lastMessageIndex + 1);

    return this.condenseMessages(chatId, newMessages, previousSummary.summary, threshold);
  }

  /**
   * Condense the messages if needed based on the token threshold.
   *
   * If condensation is performed, returns a PrepareStepResult containing
   * the updated system prompt and the last message to continue the chat.
   * If no condensation is needed, returns undefined.
   */
  private async condenseMessages(
    chatId: string,
    messages: UIMessage[],
    existingSummary: string | undefined,
    threshold: number,
  ): Promise<PrepareStepResult<AllTools>> {
    const modelMessages = await convertToModelMessages(messages);
    const totalTokens = modelMessages.reduce((sum, msg) => sum + getModelMessageTokenCount(msg), 0);

    if (totalTokens < threshold) {
      return undefined;
    }

    if (modelMessages.length <= 2) {
      console.warn('prepareStep: Not enough new messages to condense conversation.');
      return undefined;
    }

    const [previousMessages, lastMessage] = [messages.slice(0, -1), messages[messages.length - 1]];

    const system = systemPromptForCondensedConversation();
    const previousModelMessages = await convertToModelMessages(previousMessages);
    const prompt = promptForCondensedConversation(existingSummary, previousModelMessages);

    const textResponse = await generateText({
      model: getModel({ name: 'gpt-4.1-mini', provider: 'openai' }, this.credentialsManager),
      system,
      prompt,
    });

    const lastModelMessage = await convertToModelMessages([lastMessage]);

    // Save or update the summary
    this.db.upsertChatSummary({
      chat_id: chatId,
      summary: textResponse.text,
      last_message_id: lastMessage.id,
    });

    return {
      system: systemPromptForContinuedConversation(textResponse.text),
      messages: lastModelMessage,
    };
  }

  /**
   * Resume a chat by fetching its messages and continuing the chat session.
   */
  async resumeChat(
    chatId: string,
    options: ChatRequestOptions,
    onUpdate: (chunk: UIMessageChunk) => void,
    onUsage: (usage: UsageUpdate) => void,
  ): Promise<string> {
    const messages = await this.getChatMessages(chatId);
    return this.chat(chatId, messages, options, onUpdate, onUsage);
  }

  private async ensureChatHasTitle(chatId: string, firstMessage: UIMessage) {
    const chat = this.db.getChat(chatId);

    if (!chat) {
      throw new Error(`Chat with id ${chatId} does not exist`);
    }

    if (chat.title && chat.title.trim().length > 0) {
      return;
    }

    // Generate a title based on the first user message
    if (firstMessage.role !== 'user') {
      return;
    }

    const textParts = firstMessage.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text);
    const messageText = textParts.join(' ').slice(0, 1000); // Limit to first 1000 characters

    const prompt = `
Please, take a look at the following message from a user and generate a concise and descriptive title for the chat.
The title should be no longer than 5 words and should summarize the main topic or question posed by the user.
Answer with only the title, without any additional text.

<user-message>
  ${messageText}
</user-message>
`;

    const title = await generateText({
      model: getModel({ name: 'gpt-4.1-mini', provider: 'openai' }, this.credentialsManager),
      prompt,
    });

    this.updateChatTitle(chatId, title.text);
  }

  /**
   * Stop an ongoing chat by aborting its controller.
   */
  stopChat(chatId: string) {
    const controller = this.activeControllers.get(chatId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(chatId);
    }
  }

  private getAbortControllerSignal(id: string): AbortSignal {
    let controller = this.activeControllers.get(id);
    if (!controller) {
      controller = new AbortController();
      this.activeControllers.set(id, controller);
    }
    return controller.signal;
  }

  static getInstance(
    db: DB,
    credentialsManager: CredentialsManager,
    navigator: Navigator,
  ): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager(db, credentialsManager, navigator);
    }
    return ChatManager.instance;
  }

  destroy() {
    // Abort all active controllers
    this.activeControllers.forEach((controller) => {
      controller.abort();
    });
    this.activeControllers.clear();
    this.chatEventListeners.clear();
    ChatManager.instance = undefined;
  }
}
