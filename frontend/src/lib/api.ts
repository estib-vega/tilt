import { ClientResponse, hc } from "hono/client";
import { APIRoutes } from "@server/app";
import { readerToStringIterator } from "@/utils/promise";
import { isLLMGenerateStreamResponse } from "@server/lib/llm";

const apiClient = hc<APIRoutes>("/");

// ==============================================================================
// AUTH API
// ==============================================================================

/**
 * Log in to the application.
 */
export function login() {
  const url = "/api/auth/login";
  window.location.href = url.toString();
}

export async function isAuthenticated() {
  const response = await apiClient.api.auth.me.$get();
  return response.ok;
}

// ==============================================================================
// LLM API
// ==============================================================================

interface LLMStreamHandlerParams {
  onStart?: () => void;
  onMessage: (message: string) => void;
  onEnd: (fullResponse: string, context: number[]) => void;
}

/**
 * Handles the LLM stream response and processes the data received from the server.
 *
 * @param response - The response object received from the server.
 * @param params - The parameters for the LLM stream handler.
 * @returns A promise that resolves to a boolean indicating whether the stream processing was successful.
 * @throws An error if the response is not successful or if there is an issue with the readable stream.
 */
async function handleLLMStream<T, U extends number, F extends string>(
  response: ClientResponse<T, U, F>,
  params: LLMStreamHandlerParams
): Promise<boolean> {
  if (!response.ok) {
    throw new Error("Failed to generate text.");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to create a readable stream.");
  }

  params.onStart?.();

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
        return true;
      }

      buffer.push(parsed.response);
      params.onMessage(parsed.response);
    }
  }

  return false;
}

interface LLMGenerateParams extends LLMStreamHandlerParams {
  prompt: string;
  context?: number[];
}

/**
 * Generates a text response to the given prompt.
 */
export async function llmGenerate(params: LLMGenerateParams) {
  const response = await apiClient.api.llm.generate.$post({
    json: {
      prompt: params.prompt,
      context: params.context,
    },
  });

  return handleLLMStream(response, params);
}

export interface LLMChatGreeterParams extends LLMStreamHandlerParams {}

/**
 * Generate a text chat greeting.
 */
export async function llmChatGreeting(params: LLMChatGreeterParams) {
  const response = await apiClient.api.llm.greeting.$get();
  return handleLLMStream(response, params);
}

export interface LLMChatTitleParams extends LLMStreamHandlerParams {
  context: number[];
}

/**
 * Generate a title for the current chat.
 */
export async function llmChatTitle(params: LLMChatTitleParams) {
  const response = await apiClient.api.llm.title.$post({
    json: {
      context: params.context,
    },
  });

  return handleLLMStream(response, params);
}
