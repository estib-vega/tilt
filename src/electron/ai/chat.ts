import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, UIMessageChunk } from 'ai';

/**
 * Streams a chat response from the AI model based on the provided messages.
 */
export async function chat(
  messages: UIMessage[],
  onUpdate: (chunk: UIMessageChunk) => void,
  abortSignal?: AbortSignal,
): Promise<string> {
  const modelMessages = convertToModelMessages(messages);

  const streamResponse = streamText({
    model: openai('gpt-5-mini'),
    messages: modelMessages,
    abortSignal,
  });

  const stream = streamResponse.toUIMessageStream();

  for await (const chunk of stream) {
    onUpdate(chunk);
  }

  return streamResponse.text;
}

export interface ChatStreamParams {
  messages: UIMessage[];
}
