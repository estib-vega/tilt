import { z } from "zod";
import { ollamaGenerateStream } from "./ollama";
import { CHAT_GREETING, CHAT_MESSAGE, CHAT_TITLE } from "./prompts";
import { MessageRole } from "./chatStreamGeneration";
import { useOllama } from "./environment";
import { openAIGenerateStream } from "./openai";

export enum LLMServiceProvider {
  Ollama = "ollama",
  OpenAI = "openai",
}

const ChatMessagesSchema = z.array(
  z.object({
    role: z.enum([MessageRole.Assistant, MessageRole.User]),
    content: z.string().min(1),
  })
);

export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1),
  messages: ChatMessagesSchema,
  context: z.number().array().optional(),
});

type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export function generate(req: GenerateRequest) {
  if (useOllama())
    return ollamaGenerateStream({
      model: "llama3.1",
      prompt: req.prompt,
      context: req.context,
      temperature: 0.5,
    });

  return openAIGenerateStream({
    model: "gpt-4o-mini",
    prompt: req.prompt,
    messages: req.messages,
    systemMessage: CHAT_MESSAGE,
  });
}

export function chatGreeting() {
  return generate({
    prompt: CHAT_GREETING,
    messages: [],
  });
}

export const ChatTitleRequestSchema = GenerateRequestSchema.omit({
  prompt: true,
});

type ChatTitleRequest = z.infer<typeof ChatTitleRequestSchema>;

export function chatTitle(req: ChatTitleRequest) {
  return generate({
    messages: [],
    prompt: CHAT_TITLE,
    context: req.context,
  });
}
