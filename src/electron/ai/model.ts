import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import CredentialsManager from '@api/model/credentials';
import OllamaManager from '@api/model/ollama';
import { createOllama } from 'ollama-ai-provider-v2';

const MODEL_PROVIDERS = ['ollama', 'openai', 'anthropic'] as const;
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
    case 'anthropic': {
      const apiKey = credentialsManager.getCredential('anthropic');
      if (!apiKey) {
        throw new Error('Anthropic API key not found in credentials manager');
      }
      return getAnthropic({ model: modelIdentifier.name, apiKey });
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

interface AnthropicParameters {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
}

export function getAnthropic(params?: AnthropicParameters) {
  const model = params?.model ?? 'claude-haiku-4-5-20251101';
  const apiKey = params?.apiKey ?? process.env.ANTHROPIC_API_KEY;

  const anthropic = createAnthropic({
    apiKey,
    baseURL: params?.baseUrl,
  });

  return anthropic(model);
}

export interface ModelInfo extends ModelIdentifier {
  displayName: string;
}

export type ProviderModelList = [ModelProvider, ModelInfo[]][];

const MODEL_PROVIDER_LIST = [
  [
    'openai',
    [
      { provider: 'openai', name: 'gpt-5', displayName: 'GPT 5' },
      { provider: 'openai', name: 'gpt-5-mini', displayName: 'GPT 5 Mini' },
      { provider: 'openai', name: 'gpt-5-nano', displayName: 'GPT 5 Nano' },
      { provider: 'openai', name: 'gpt-4.1', displayName: 'GPT 4.1' },
      { provider: 'openai', name: 'gpt-4.1-mini', displayName: 'GPT 4 Mini' },
      { provider: 'openai', name: 'gpt-4', displayName: 'GPT 4' },
    ],
  ],
  [
    'anthropic',
    [
      { provider: 'anthropic', name: 'claude-opus-4-5-20251101', displayName: 'Claude 4.5 Opus' },
      {
        provider: 'anthropic',
        name: 'claude-sonnet-4-5-20250929',
        displayName: 'Claude 4.5 Sonnet',
      },
      { provider: 'anthropic', name: 'claude-haiku-4-5-20251001', displayName: 'Claude 4.5 Haiku' },
    ],
  ],
] satisfies ProviderModelList;

export async function availableModels(
  credentialsManager: CredentialsManager,
  ollamaManager: OllamaManager,
): Promise<ProviderModelList> {
  const availableProviders = credentialsManager.listProviders();
  const result: ProviderModelList = [];

  const remoteModels = MODEL_PROVIDER_LIST.filter(([provider]) => {
    return availableProviders.includes(provider);
  });

  result.push(...remoteModels);

  const ollamaModels = await ollamaManager.listModels();

  if (ollamaModels.length > 0) {
    const ollamaModelInfos: ModelInfo[] = ollamaModels.map((modelName) => ({
      provider: 'ollama',
      name: modelName,
      displayName: modelName,
    }));
    result.push(['ollama', ollamaModelInfos]);
  }

  return result;
}

export async function defaultModelIdentifier(
  credentialsManager: CredentialsManager,
  ollamaManager: OllamaManager,
): Promise<ModelIdentifier | null> {
  const models = await availableModels(credentialsManager, ollamaManager);
  const ollamaModels = models.find(([provider]) => provider === 'ollama');
  if (ollamaModels && ollamaModels[1].length > 0) {
    return ollamaModels[1][0];
  }
  const restModels = models.find(([provider]) => provider !== 'ollama');
  if (restModels && restModels[1].length > 0) {
    return restModels[1][0];
  }
  return null;
}
