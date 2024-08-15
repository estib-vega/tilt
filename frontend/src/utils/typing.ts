import { LLMGenerateStreamResponse } from "@server/lib/chatStreamGeneration";
import { UnknownObject } from "@server/utils/typing";

export function isUnknownObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isLLMGenerateStreamResponse(
  value: unknown
): value is LLMGenerateStreamResponse {
  if (!isUnknownObject(value)) {
    return false;
  }
  return typeof value.response === "string" && typeof value.done === "boolean";
}
