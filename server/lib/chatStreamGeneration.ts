export enum MessageRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
}

export interface ChatMessageInfo {
  role: MessageRole;
  content: string;
}

export interface GenerateParams<ModelType extends string> {
  model: ModelType;
  prompt: string;
  systemMessage?: string;
  context?: number[];
  messages?: ChatMessageInfo[];
  temperature?: number;
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