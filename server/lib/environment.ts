import { raise } from "../utils/errors";

/**
 * Determine if the Ollama API should be used instead of OpenAI.
 * It should be enabled only in local development.
 */
export function useOllama(): boolean {
  return process.env.USE_OLLAMA === "true";
}

export function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY || raise("OpenAI API key is not set.");
}
