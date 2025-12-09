import { createOpenAI } from '@ai-sdk/openai';
import CredentialsManager from '@api/model/credentials';
import { createOllama } from 'ollama-ai-provider-v2';

const MODEL_PROVIDERS = ['ollama', 'openai'] as const;
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];

export function isModelProvider(something: unknown): something is ModelProvider {
  return typeof something === 'string' && MODEL_PROVIDERS.includes(something as ModelProvider);
}

export interface ModelIdentifier {
  name: string;
  provider: ModelProvider;
}

export function isModelIdentifier(something: unknown): something is ModelIdentifier {
  if (typeof something !== 'object' || something === null) {
    return false;
  }
  if (typeof (something as any).name !== 'string') {
    return false;
  }
  if (!isModelProvider((something as any).provider)) {
    return false;
  }
  return true;
}

export function getModel(modelIdentifier: ModelIdentifier, credentialsManager: CredentialsManager) {
  switch (modelIdentifier.provider) {
    case 'ollama':
      return getOllama({ model: modelIdentifier.name });
    case 'openai': {
      const apiKey = credentialsManager.getCredential('openai');
      if (!apiKey) {
        throw new Error('OpenAI API key not found in credentials manager');
      }
      return getOpenAI({ model: modelIdentifier.name, apiKey });
    }
  }
}

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
