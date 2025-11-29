import { openai } from '@ai-sdk/openai';
import { UIChat } from '@api/api';
import DB from '@api/db/sqlite';
import { streamText, UIMessage, convertToModelMessages, UIMessageChunk } from 'ai';

export default class ChatManager {
  private static instance: ChatManager | undefined;
  private activeControllers = new Map<string, AbortController>(); // id → abortController

  private constructor(private db: DB) {
    // Private constructor to enforce singleton pattern
    this.activeControllers = new Map();
  }

  listChats(): UIChat[] {
    return this.db.listChats();
  }

  /**
   * Get all messages for a chat from the database.
   */
  getChatMessages(chatId: string): UIMessage[] {
    return this.db.getMessagesForChat(chatId).map(
      (dbMessage): UIMessage => ({
        id: dbMessage.id,
        role: dbMessage.role as UIMessage['role'],
        parts: dbMessage.parts as UIMessage['parts'],
        metadata: dbMessage.metadata,
      }),
    );
  }

  /**
   * Streams a chat response from the AI model based on the provided messages.
   */
  async chat(
    chatId: string,
    messages: UIMessage[],
    onUpdate: (chunk: UIMessageChunk) => void,
  ): Promise<string> {
    const abortSignal = this.getAbortControllerSignal(chatId);
    const modelMessages = convertToModelMessages(messages);

    const lastIdx = messages.length - 1;
    if (lastIdx >= 0) {
      const lastMessage = messages[messages.length - 1];
      this.db.addMessageToChat(chatId, lastMessage, lastIdx);
    }

    const streamResponse = streamText({
      model: openai('gpt-5-mini'),
      messages: modelMessages,
      abortSignal,
    });

    const stream = streamResponse.toUIMessageStream({
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
    ChatManager.instance = undefined;
  }
}
