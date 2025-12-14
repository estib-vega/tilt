import type { ModelIdentifier } from '@api/ai/model';
import type { ChatChunkEvent, ChatEndEvent } from '@api/api';
import type { ChatRequestOptions, ChatTransport, UIMessage, UIMessageChunk } from 'ai';

export default class ElectronTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private static streams: Map<string, ReadableStream<UIMessageChunk>> = new Map();
  private static chatRequestOptions: Map<string, RequestOptions> = new Map();

  static setChatRequestOptions(chatId: string, options: RequestOptions): void {
    ElectronTransport.chatRequestOptions.set(chatId, options);
  }

  static getChatRequestOptions(chatId: string): RequestOptions | undefined {
    return ElectronTransport.chatRequestOptions.get(chatId);
  }

  async sendMessages(
    options: {
      trigger: 'submit-message' | 'regenerate-message';
      chatId: string;
      messageId: string | undefined;
      messages: UI_MESSAGE[];
      abortSignal: AbortSignal | undefined;
    } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk>> {
    // Create a browser-readable stream that pulls data over IPC
    const chatOptions = parseEletronChatRequestOptions(options);
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        // incoming token chunks
        const onChunk = (data: ChatChunkEvent) => {
          if (data.id !== options.chatId) return;
          controller.enqueue(data.chunk);
        };

        const onEnd = (data: ChatEndEvent) => {
          if (data.id !== options.chatId) return;
          controller.close();
          cleanup();
        };

        const cleanUpChunk = window.api.onChatChunk(onChunk);
        const cleanUpEnd = window.api.onChatEnd(onEnd);

        const onAbort = () => {
          window.api.chatInterrupt(options.chatId);
          controller.error(new DOMException('Aborted', 'AbortError'));
          cleanup();
        };

        // Clean up
        const cleanup = () => {
          cleanUpChunk();
          cleanUpEnd();
          options.abortSignal?.removeEventListener('abort', onAbort);
          ElectronTransport.chatRequestOptions.delete(options.chatId);
        };

        // Handle abort
        options.abortSignal?.addEventListener('abort', onAbort);

        // trigger backend stream
        window.api.chatStart({
          id: options.chatId,
          messages: options.messages,
          webSearch: chatOptions.webSearch,
          modelIdentifier: chatOptions.modelIdentifier,
        });
      },
    });

    ElectronTransport.streams.set(options.chatId, stream);

    return stream;
  }

  async reconnectToStream(
    options: { chatId: string } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    const cachedStream = ElectronTransport.streams.get(options.chatId);
    if (cachedStream) {
      return ElectronTransport.streams.get(options.chatId)!;
    }

    const chats = await window.api.listChats();
    const chatExists = chats.some((chat) => chat.id === options.chatId);
    if (!chatExists) {
      return null;
    }
    const chatOptions = ElectronTransport.chatRequestOptions.get(options.chatId);
    if (!chatOptions) {
      // Unable to reconnect without previous chat options
      return null;
    }
    ElectronTransport.chatRequestOptions.delete(options.chatId);

    // Create a browser-readable stream that pulls data over IPC
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        // incoming token chunks
        const onChunk = (data: ChatChunkEvent) => {
          if (data.id !== options.chatId) return;
          controller.enqueue(data.chunk);
        };

        const onEnd = (data: ChatEndEvent) => {
          if (data.id !== options.chatId) return;
          controller.close();
          cleanup();
        };

        const cleanUpChunk = window.api.onChatChunk(onChunk);
        const cleanUpEnd = window.api.onChatEnd(onEnd);

        // Clean up
        const cleanup = () => {
          cleanUpChunk();
          cleanUpEnd();
          ElectronTransport.chatRequestOptions.delete(options.chatId);
        };

        // trigger backend stream
        window.api.chatResume({
          id: options.chatId,
          webSearch: chatOptions.webSearch,
          modelIdentifier: chatOptions.modelIdentifier,
        });
      },
    });

    ElectronTransport.streams.set(options.chatId, stream);

    return stream;
  }
}

export interface RequestOptions {
  webSearch: boolean;
  modelIdentifier: ModelIdentifier;
}

interface ElectronChatRequestOptions {
  body: RequestOptions;
}

function isElectronChatRequestOptions(something: unknown): something is ElectronChatRequestOptions {
  if (typeof something !== 'object' || something === null) return false;
  if (!(something as any).body) return false;
  const obj = something as ElectronChatRequestOptions;
  return typeof obj.body.webSearch === 'boolean' && typeof obj.body.modelIdentifier === 'object';
}

function parseEletronChatRequestOptions(options: ChatRequestOptions): RequestOptions {
  if (isElectronChatRequestOptions(options)) {
    return {
      webSearch: options.body.webSearch ?? false,
      modelIdentifier: options.body.modelIdentifier,
    };
  }

  throw new Error(
    'Invalid chat request options for Electron transport: ' + JSON.stringify(options),
  );
}
