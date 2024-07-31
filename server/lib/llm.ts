import { z } from "zod";
import { ollamaGenerateStream } from "./ollama";

export type ChatMessageAuthor = "user" | "bot";

export interface ChatMessageInfo {
  author: ChatMessageAuthor;
  content: string;
}

export enum LLMServiceProvider {
  Ollama = "ollama",
  OpenAI = "openai",
}


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
