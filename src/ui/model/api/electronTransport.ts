import type { ChatChunkEvent, ChatEndEvent } from '@api/api';
import type { ChatRequestOptions, ChatTransport, UIMessage, UIMessageChunk } from 'ai';

export default class ElectronTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
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
        };

        // Handle abort
        options.abortSignal?.addEventListener('abort', onAbort);

        const chatOptions = parseEletronChatRequestOptions(options);

        // trigger backend stream
        window.api.chatStart({
          id: options.chatId,
          messages: options.messages,
          webSerch: chatOptions.webSearch,
        });
      },
    });

    return stream;
  }

  async reconnectToStream(
    options: { chatId: string } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    console.log('Reconnecting to stream for chatId:', options.chatId);
    const chats = await window.api.listChats();
    const chatExists = chats.some((chat) => chat.id === options.chatId);
    if (!chatExists) {
      return null;
    }
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
        };

        const chatOptions = parseEletronChatRequestOptions(options);

        // trigger backend stream
        window.api.chatResume({
          id: options.chatId,
          webSerch: chatOptions.webSearch,
        });
      },
    });

    return stream;
  }
}

interface RequestOptions {
  webSearch: boolean;
}

interface ElectronChatRequestOptions {
  body?: RequestOptions;
}

function isElectronChatRequestOptions(something: unknown): something is ElectronChatRequestOptions {
  if (typeof something !== 'object' || something === null) return false;
  const obj = something as ElectronChatRequestOptions;
  if (obj.body && typeof obj.body.webSearch !== 'boolean') return false;
  return true;
}

function parseEletronChatRequestOptions(options: ChatRequestOptions): RequestOptions {
  if (isElectronChatRequestOptions(options)) {
    return {
      webSearch: options.body?.webSearch ?? false,
    };
  }

  return {
    webSearch: false,
  };
}
