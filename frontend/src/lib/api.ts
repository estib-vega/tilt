import { hc } from "hono/client";
import { APIRoutes } from "@server/app";
import { readerToStringIterator } from "@/utils/promise";
import { isLLMGenerateStreamResponse } from "@server/lib/llm";

const apiClient = hc<APIRoutes>("/");

interface LLMGenerateParams {
  prompt: string;
  context?: number[];
  onMessage: (message: string) => void;
  onEnd: (fullResponse: string, context: number[]) => void;
}

export async function llmGenerate(params: LLMGenerateParams) {
  const response = await apiClient.api.llm.generate.$post({
    json: {
      prompt: params.prompt,
      context: params.context,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to generate text.");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to create a readable stream.");
  }

  const buffer: string[] = [];

  for await (const m of readerToStringIterator(reader)) {
    const split = m.split("\n");
    for (const s of split) {
      if (!s) {
        continue;
      }
      const parsed = JSON.parse(s);
      if (!isLLMGenerateStreamResponse(parsed)) {
        throw new Error("Invalid response from the server: " + s);
      }

      if (parsed.done) {
        params.onEnd(buffer.join(""), parsed.context);
        return;
      }

      buffer.push(parsed.response);
      params.onMessage(parsed.response);
    }
  }
}
