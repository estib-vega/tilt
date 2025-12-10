import type { ModelIdentifier, ModelProvider } from '@api/ai/model';
import React from 'react';

export interface ModelInfo extends ModelIdentifier {
  displayName: string;
}

type ProviderModelList = [ModelProvider, ModelInfo[]][];

const MODEL_PROVIDER_LIST = [
  [
    'ollama',
    [
      { provider: 'ollama', name: 'gpt-oss:20b', displayName: 'GPT OSS 20B' },
      { provider: 'ollama', name: 'llama2:13b', displayName: 'LLaMA 2 13B' },
    ],
  ],
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
] satisfies ProviderModelList;

export function useListModels() {
  return MODEL_PROVIDER_LIST;
}

export function useModelSelector() {
  const [selectedModel, setSelectedModel] = React.useState<ModelIdentifier>({
    provider: 'ollama',
    name: 'gpt-oss:20b',
  });

  const isSelectedModel = React.useCallback(
    (model: ModelInfo) =>
      selectedModel.name === model.name && selectedModel.provider === model.provider,
    [selectedModel],
  );

  return {
    selectedModel,
    setSelectedModel,
    isSelectedModel,
  };
}
