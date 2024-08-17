import { LLMGenerateStreamResponse } from "@server/lib/ai/chatStreamGeneration";
import { UnknownObject } from "@server/utils/typing";

export type ItemOf<T> = T extends (infer U)[] ? U : never;

export function isUnknownObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNumArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

export function isLLMGenerateStreamResponse(
  value: unknown
): value is LLMGenerateStreamResponse {
  if (!isUnknownObject(value)) {
    return false;
  }
  return (
    (typeof value.response === "string" || isNumArray(value.context)) &&
    typeof value.done === "boolean"
  );
}
