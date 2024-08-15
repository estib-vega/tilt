import OpenAI from "openai";
import type {
  GenerateParams,
  LLMGenerateStreamResponse,
} from "./chatStreamGeneration";
import { getOpenAIKey } from "./environment";

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
  const previousMessages = params.messages ?? [];

  const completion = await openai.chat.completions.create({
    model: params.model,
    messages: [
      { role: "system", content: "You are a helpful assistant." },
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
