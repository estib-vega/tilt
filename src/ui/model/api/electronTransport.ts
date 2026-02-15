import type { ModelIdentifier } from '@api/ai/model';
import type { MessageChunkEvent, MessageEndEvent } from '@api/api';
import type { ProjectId } from '@api/db/tables/projects';
import type { ChatRequestOptions, ChatTransport, UIMessage, UIMessageChunk } from 'ai';

export class ElectronReviewChatTransport<UI_MESSAGE extends UIMessage>
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
    const chatOptions = parseElectronReviewChatRequestOptions(options);
    const stream = ElectronReviewChatTransport.createChatStream(options, chatOptions);

    return stream;
  }

  static createChatStream(
    options: {
      trigger: 'submit-message' | 'regenerate-message';
      chatId: string;
      messageId: string | undefined;
      messages: UIMessage[];
      abortSignal: AbortSignal | undefined;
    } & ChatRequestOptions,
    chatOptions: ReviewRequestOptions,
  ) {
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        // incoming token chunks
        const onChunk = (data: MessageChunkEvent) => {
          if (data.id !== options.chatId) return;
          controller.enqueue(data.chunk);
        };

        const onEnd = (data: MessageEndEvent) => {
          if (data.id !== options.chatId) return;
          controller.close();
          cleanup();
        };

        const cleanUpChunk = window.api.onReviewChatChunk(onChunk);
        const cleanUpEnd = window.api.onReviewChatEnd(onEnd);

        // Clean up
        const cleanup = () => {
          cleanUpChunk();
          cleanUpEnd();
        };

        // trigger backend stream
        window.api.reviewChatStart({
          projectId: chatOptions.projectId,
          cliId: chatOptions.cliId,
          messages: options.messages,
          modelIdentifier: chatOptions.modelIdentifier,
        });
      },
    });

    return stream;
  }

  async reconnectToStream(
    _options: { chatId: string } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
export class ElectronChatTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private static streams: Map<string, ReadableStream<UIMessageChunk>> = new Map();

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
    const chatOptions = parseElectronChatRequestOptions(options);
    const stream = ElectronChatTransport.createChatStream(options, chatOptions);

    return stream;
  }

  static createChatStream(
    options: {
      trigger: 'submit-message' | 'regenerate-message';
      chatId: string;
      messageId: string | undefined;
      messages: UIMessage[];
      abortSignal: AbortSignal | undefined;
    } & ChatRequestOptions,
    chatOptions: RequestOptions,
  ) {
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        // incoming token chunks
        const onChunk = (data: MessageChunkEvent) => {
          if (data.id !== options.chatId) return;
          controller.enqueue(data.chunk);
        };

        const onEnd = (data: MessageEndEvent) => {
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
          ElectronChatTransport.streams.delete(options.chatId);
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

    ElectronChatTransport.streams.set(options.chatId, stream);
    return stream;
  }

  async reconnectToStream(
    options: { chatId: string } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    const cachedStream = ElectronChatTransport.streams.get(options.chatId);
    if (cachedStream) {
      return ElectronChatTransport.streams.get(options.chatId)!;
    }
    return null;
  }
}

interface BaseRequestOptions {
  modelIdentifier: ModelIdentifier;
}

export interface RequestOptions extends BaseRequestOptions {
  webSearch: boolean;
}

export interface ReviewRequestOptions extends BaseRequestOptions {
  projectId: ProjectId;
  cliId: string;
}

interface ElectronChatRequestOptions {
  body: RequestOptions;
}

interface ElectronReviewChatRequestOptions {
  body: ReviewRequestOptions;
}
function isElectronChatRequestOptions(something: unknown): something is ElectronChatRequestOptions {
  if (typeof something !== 'object' || something === null) return false;
  if (!(something as any).body) return false;
  const obj = something as ElectronChatRequestOptions;
  return typeof obj.body.webSearch === 'boolean' && typeof obj.body.modelIdentifier === 'object';
}

function parseElectronChatRequestOptions(options: ChatRequestOptions): RequestOptions {
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

function isElectronReviewChatRequestOptions(
  something: unknown,
): something is ElectronReviewChatRequestOptions {
  if (typeof something !== 'object' || something === null) return false;
  if (!(something as any).body) return false;
  const obj = something as ElectronReviewChatRequestOptions;
  return (
    typeof obj.body.modelIdentifier === 'object' &&
    typeof (obj.body as any).projectId === 'string' &&
    typeof (obj.body as any).cliId === 'string'
  );
}

function parseElectronReviewChatRequestOptions(options: ChatRequestOptions): ReviewRequestOptions {
  if (isElectronReviewChatRequestOptions(options)) {
    return {
      modelIdentifier: options.body.modelIdentifier,
      projectId: options.body.projectId,
      cliId: options.body.cliId,
    };
  }

  throw new Error(
    'Invalid review chat request options for Electron transport: ' + JSON.stringify(options),
  );
}
