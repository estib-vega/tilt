import { ChatRequestOptions, UIChat, UIChatTitleUpdateEvent } from '@api/api';
import DB from '@api/db/sqlite';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  UIMessageChunk,
  validateUIMessages,
  generateText,
  createIdGenerator,
  stepCountIs,
} from 'ai';
import { getOllama, getOpenAI } from './model.js';
import WebSearch from './webSearch.js';
import { generateTools } from './tools.js';

type ChatTitleUpdateListener = (event: UIChatTitleUpdateEvent) => void;

export default class ChatManager {
  private static instance: ChatManager | undefined;
  private activeControllers = new Map<string, AbortController>(); // id → abortController
  private chatTitleEventListeners: Set<ChatTitleUpdateListener>;
  private webSearch: WebSearch;

  private constructor(private db: DB) {
    // Private constructor to enforce singleton pattern
    this.activeControllers = new Map();
    this.chatTitleEventListeners = new Set();
    this.webSearch = new WebSearch();
  }

  addChatTitleUpdateListener(listener: ChatTitleUpdateListener): void {
    this.chatTitleEventListeners.add(listener);
  }

  private notifyChatTitleUpdate(event: UIChatTitleUpdateEvent): void {
    for (const listener of this.chatTitleEventListeners) {
      listener(event);
    }
  }

  /**
   * Update the title of a chat in the database.
   */
  updateChatTitle(chatId: string, title: string): UIChat {
    const chat = this.db.updateChatTitle(chatId, title);
    this.notifyChatTitleUpdate({ id: chat.id, title: chat.title });
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
  createChat(): string {
    return this.db.createChat();
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
  listChats(): UIChat[] {
    return this.db.listChats().map(
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

    return await validateUIMessages({ messages });
  }

  /**
   * Streams a chat response from the AI model based on the provided messages.
   */
  async chat(
    chatId: string,
    messages: UIMessage[],
    options: ChatRequestOptions,
    onUpdate: (chunk: UIMessageChunk) => void,
  ): Promise<string> {
    const abortSignal = this.getAbortControllerSignal(chatId);
    const modelMessages = convertToModelMessages(messages);

    const lastIdx = messages.length - 1;
    if (lastIdx >= 0) {
      const lastMessage = messages[messages.length - 1];
      this.db.addMessageToChat(chatId, lastMessage, lastIdx);

      if (lastMessage.role !== 'user') {
        // This signals that there is a chat session
        // is resuming, so we don't need to trigger generation again.
        return '';
      }
    }

    this.ensureChatHasTitle(chatId, messages[0]).catch((err) => {
      console.error('Chat: Failed to ensure chat has title:', err);
    });

    const streamResponse = streamText({
      model: getOllama(),
      messages: modelMessages,
      tools: generateTools({
        useWebSearch: options.webSearch,
        webSearch: this.webSearch,
      }),
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
        this.db.addMessageToChat(chatId, responseMessage, lastIdx + 1);
      },
    });

    for await (const chunk of stream) {
      onUpdate(chunk);
    }

    return streamResponse.text;
  }

  /**
   * Resume a chat by fetching its messages and continuing the chat session.
   */
  async resumeChat(
    chatId: string,
    options: ChatRequestOptions,
    onUpdate: (chunk: UIMessageChunk) => void,
  ): Promise<string> {
    const messages = await this.getChatMessages(chatId);
    return this.chat(chatId, messages, options, onUpdate);
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
      model: getOpenAI({ model: 'gpt-5-nano' }),
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

  static getInstance(db: DB): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager(db);
    }
    return ChatManager.instance;
  }

  destroy() {
    // Abort all active controllers
    this.activeControllers.forEach((controller) => {
      controller.abort();
    });
    this.activeControllers.clear();
    this.chatTitleEventListeners.clear();
    ChatManager.instance = undefined;
  }
}
