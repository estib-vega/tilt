import type { ChatChunkEvent, ChatEndEvent } from '@api/preload'
import type {
  ChatRequestOptions,
  ChatTransport,
  UIMessage,
  UIMessageChunk,
} from 'ai'

export default class ElectronTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  async sendMessages(
    options: {
      trigger: 'submit-message' | 'regenerate-message'
      chatId: string
      messageId: string | undefined
      messages: UI_MESSAGE[]
      abortSignal: AbortSignal | undefined
    } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk>> {
    // Create a browser-readable stream that pulls data over IPC
    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        // incoming token chunks
        const onChunk = (data: ChatChunkEvent) => {
          if (data.id !== options.chatId) return
          controller.enqueue(data.chunk)
        }

        const onEnd = (data: ChatEndEvent) => {
          if (data.id !== options.chatId) return
          controller.close()
          cleanup()
        }

        const cleanUpChunk = window.api.onChatChunk(onChunk)
        const cleanUpEnd = window.api.onChatEnd(onEnd)

        // Clean up
        const cleanup = () => {
          cleanUpChunk()
          cleanUpEnd()
        }

        // trigger backend stream
        window.api.chatStart(options.chatId, options.messages)
      },
    })

    return stream
  }

  async reconnectToStream(
    _options: { chatId: string } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    // TODO: Implement reconnect logic if needed

    return null
  }
}
