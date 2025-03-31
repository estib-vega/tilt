import OpenAI from "openai";
import type {
  GenerateParams,
  LLMGenerateStreamResponse,
} from "./chatStreamGeneration";
import { getOpenAIKey } from "../environment";
import { readerToStringIterator } from "../../utils/streaming";
import { z } from "zod";

const DEFAULT_SYSTEM_MESSAGE = "You are a helpful assistant.";

const openai = new OpenAI({
  apiKey: getOpenAIKey(),
});

type OpenAIModel = "gpt-4o-mini";

function chunkToResponse(
  chunk: OpenAI.Chat.Completions.ChatCompletionChunk
): LLMGenerateStreamResponse {
  return {
    response: chunk.choices[0].delta.content ?? "",
    done: false,
  };
}

function encodeResponse(response: LLMGenerateStreamResponse): Uint8Array {
  const content = JSON.stringify(response) + "\n";
  return new TextEncoder().encode(content);
}

export async function openAIGenerateStream(
  params: GenerateParams<OpenAIModel>
): Promise<ReadableStream<Uint8Array>> {
  const systemMessage = params.systemMessage ?? DEFAULT_SYSTEM_MESSAGE;
  const previousMessages = params.messages ?? [];

  const completion = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: systemMessage },
      ...previousMessages,
      { role: "user", content: params.prompt },
    ],
    temperature: params.temperature,
    stream: true,
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      async function read() {
        for await (const chunk of completion) {
          const data = chunkToResponse(chunk);
          const encoded = encodeResponse(data);
          controller.enqueue(encoded);
        }

        const data: LLMGenerateStreamResponse = { done: true, context: [] };
        const encoded = encodeResponse(data);
        controller.enqueue(encoded);

        controller.close();
      }

      return read();
    },
  });

  return stream;
}

const StreamResponseChunkSchema = z.object({
  response: z.string().optional(),
  done: z.boolean(),
});

/**
 * Streams and prints responses from the OpenAI API.
 *
 * @param params - The parameters required to generate a stream from the OpenAI API.
 * @returns A promise that resolves when the streaming and printing process is complete.
 */
export async function openAIPrintStream(
  params: GenerateParams<OpenAIModel>
): Promise<void> {
  const stream = await openAIGenerateStream(params);
  const reader = stream.getReader();

  for await (const m of readerToStringIterator(reader)) {
    if (!m) {
      continue;
    }
    const parsed = JSON.parse(m);
    const response = StreamResponseChunkSchema.safeParse(parsed);
    if (response.success) {
      process.stdout.write(response.data.response ?? "\n");
    } else {
      console.error("Invalid response from the server: " + m);
    }
  }
  process.stdout.write("\n");
}
