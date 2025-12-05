import { createOpenAI } from '@ai-sdk/openai';
import DB from '@api/db/sqlite';
import { decryptString, encryptString } from '../utils/safeStorage.js';
import { LanguageModel } from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';
import { BrandedID, createBrandedID } from '../utils/id.js';

export default class ModelManager {
  private static instance: ModelManager | undefined;
  private models: ModelMap;

  private constructor(private db: DB) {
    this.models = new Map();
  }

  static getInstance(db: DB): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager(db);
    }
    return ModelManager.instance;
  }

  destroy() {
    ModelManager.instance = undefined;
  }

  add(model: Model): ModelWithId {
    const existing = this.listModels();
    if (existing.find((m) => isEqualModel(m, model))) {
      throw new Error('Model already exists');
    }

    const languageModel = this.create(model);
    this.persistModel(model);
    const modelWithId = createModelWithId(model);
    this.models.set(modelWithId.id, { ...modelWithId, llm: languageModel });
    return modelWithId;
  }

  listModels(): ModelWithId[] {
    const dbModels = this.db.listModels();
    return dbModels.map((dbModel) => {
      const model: Model = {
        provider: assertValidModelProvider(dbModel.provider),
        name: dbModel.name,
        apiKey: dbModel.api_key ? decryptString(dbModel.api_key) : null,
        baseUrl: dbModel.base_url,
      };

      const id = createModelId(model);
      return {
        ...model,
        id,
      };
    });
  }

  private persistModel(model: Model) {
    const apiKey = model.apiKey ? encryptString(model.apiKey) : null;
    this.db.saveModel({
      provider: model.provider,
      name: model.name,
      api_key: apiKey,
      base_url: model.baseUrl,
      parameters: null,
    });
  }

  private create(model: Model): LanguageModel {
    switch (model.provider) {
      case 'ollama':
        return OllamaFactory.getInstance().createModel(model);
      case 'openai':
        return OpenAIFactory.getInstance().createModel(model);
    }
  }
}

const MODEL_PROVIDERS = ['openai', 'ollama'] as const;
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];

export function isModelProvider(value: string): value is ModelProvider {
  return MODEL_PROVIDERS.includes(value as ModelProvider);
}

function assertValidModelProvider(value: string): ModelProvider {
  if (!isModelProvider(value)) throw new Error(`Not a valid Model provider: ${value}`);
  return value;
}

export interface Model {
  /**
   * The LLM provider.
   */
  provider: ModelProvider;
  /**
   * The name of the model.
   */
  name: string;
  /**
   * The API key (if any)
   */
  apiKey: string | null;
  /**
   * A custom base URL for the API.
   */
  baseUrl: string | null;
}

export type ModelId = BrandedID<'ModelId'>;

const NULL_VALUE = '<null>';
const UNICODE_SEPARATOR = '\u241F'; // Unit Separator character

export function createModelId(model: Model): ModelId {
  const encryptedApiKey = model.apiKey ? encryptString(model.apiKey) : null;
  const encryptedApiKeyString = encryptedApiKey
    ? Buffer.from(encryptedApiKey).toString('base64')
    : '';
  const idString = `${model.provider}${UNICODE_SEPARATOR}${model.name}${UNICODE_SEPARATOR}${model.baseUrl || NULL_VALUE}${UNICODE_SEPARATOR}${encryptedApiKeyString || NULL_VALUE}`;

  return createBrandedID('ModelId', idString);
}

export function parseModelId(id: ModelId): Model {
  const [provider, name, baseUrlStr, encryptedApiKeyString] = id.split(UNICODE_SEPARATOR);
  const baseUrl = baseUrlStr === NULL_VALUE ? null : baseUrlStr;
  const apiKey =
    encryptedApiKeyString === NULL_VALUE
      ? null
      : decryptString(Buffer.from(encryptedApiKeyString, 'base64'));
  return {
    provider: assertValidModelProvider(provider),
    name,
    baseUrl,
    apiKey,
  };
}

export function createModelWithId(model: Model): ModelWithId {
  const id = createModelId(model);
  return {
    ...model,
    id,
  };
}

export interface ModelWithId extends Model {
  id: ModelId;
}

interface ModelWithLLM extends ModelWithId {
  llm: LanguageModel;
}

type ModelMap = Map<ModelId, ModelWithLLM>;

type ModelParameters = Omit<Model, 'provider'>;
function isEqualModel(a: Model, b: Model): boolean {
  return (
    a.provider === b.provider &&
    a.name === b.name &&
    a.apiKey === b.apiKey &&
    a.baseUrl === b.baseUrl
  );
}

interface ModelFactory {
  /**
   * Creates a language model instance based on the provided parameters.
   */
  createModel(params: ModelParameters): LanguageModel;
}

class OllamaFactory implements ModelFactory {
  private static instance: OllamaFactory | undefined;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): OllamaFactory {
    if (!OllamaFactory.instance) {
      OllamaFactory.instance = new OllamaFactory();
    }
    return OllamaFactory.instance;
  }

  destroy() {
    OllamaFactory.instance = undefined;
  }

  createModel(params: ModelParameters): LanguageModel {
    const ollama = createOllama({
      baseURL: params.baseUrl || undefined,
    });
    return ollama(params.name);
  }
}

class OpenAIFactory implements ModelFactory {
  private static instance: OpenAIFactory | undefined;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  static getInstance(): OpenAIFactory {
    if (!OpenAIFactory.instance) {
      OpenAIFactory.instance = new OpenAIFactory();
    }
    return OpenAIFactory.instance;
  }

  destroy() {
    OpenAIFactory.instance = undefined;
  }

  createModel(params: ModelParameters): LanguageModel {
    const openai = createOpenAI({
      apiKey: params.apiKey || undefined,
      baseURL: params.baseUrl || undefined,
    });
    return openai(params.name);
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
