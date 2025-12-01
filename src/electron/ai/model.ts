import { createOpenAI } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider-v2';

interface OllamaParameters {
  model?: string;
  baseUrl?: string;
}

export function getOllama(params?: OllamaParameters) {
  const model = params?.model ?? 'gpt-oss:20b';
  const ollama = createOllama({
    baseURL: params?.baseUrl,
  });

  return ollama(model);
}

interface OpenAIParameters {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export function getOpenAI(params?: OpenAIParameters) {
  const model = params?.model ?? 'gpt-5-mini';
  const apiKey = params?.apiKey ?? process.env.OPENAI_API_KEY;

  const openai = createOpenAI({
    apiKey,
    baseURL: params?.baseUrl,
  });

  return openai(model);
}
