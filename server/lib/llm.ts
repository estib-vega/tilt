import { z } from "zod";
import { ollamaGenerateStream } from "./ollama";
import { isUnknownObject } from "../utils/typing";

export type ChatMessageAuthor = "user" | "bot";

export interface ChatMessageInfo {
  author: ChatMessageAuthor;
  content: string;
}

export enum LLMServiceProvider {
  Ollama = "ollama",
  OpenAI = "openai",
}

interface LLMGenerateStreamResponseBase {
  done: boolean;
}

interface LLMGenerateStreamResponseOngoing
  extends LLMGenerateStreamResponseBase {
  done: false;
  response: string;
}

interface LLMGenerateStreamResponseEnd extends LLMGenerateStreamResponseBase {
  done: true;
  context: number[];
}

export type LLMGenerateStreamResponse =
  | LLMGenerateStreamResponseOngoing
  | LLMGenerateStreamResponseEnd;

export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  context: z.number().array().optional(),
});

type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export function generate(req: GenerateRequest) {
  // TODO: Switch to Open AI on prod
  return ollamaGenerateStream({
    model: "llama3.1",
    prompt: req.prompt,
    context: req.context,
    temperature: 0.5,
  });
}

export function isLLMGenerateStreamResponse(
  value: unknown
): value is LLMGenerateStreamResponse {
  if (!isUnknownObject(value)) {
    return false;
  }
  return typeof value.response === "string" && typeof value.done === "boolean";
}
