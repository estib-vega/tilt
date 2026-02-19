import { randomUUID } from 'crypto';
import { decryptString, encryptString } from '../utils/safeStorage.js';
import type DB from '@api/db/sqlite.js';

export default class CredentialsManager {
  private static instance: CredentialsManager | undefined;

  private constructor(private db: DB) {}
  static getInstance(db: DB): CredentialsManager {
    if (!CredentialsManager.instance) {
      CredentialsManager.instance = new CredentialsManager(db);
    }
    return CredentialsManager.instance;
  }

  destroy() {
    CredentialsManager.instance = undefined;
  }

  addCredential(service: CredentialService, secret: string): string {
    const existing = this.db.getCredentialsByService(service);

    if (existing.length > 0) {
      // For now, only one credential per service is allowed
      throw new Error(`Credential for service ${service} already exists`);
    }

    return this.db.addCredential({
      id: randomUUID(),
      service,
      blob: encryptString(secret),
      metadata: null,
    });
  }

  deleteCredential(id: string): void {
    this.db.deleteCredential(id);
  }

  getCredential(service: CredentialService): string | null {
    const creds = this.db.getCredentialsByService(service);
    if (creds.length === 0) {
      return null;
    }
    const cred = creds[0];
    return cred ? decryptString(cred.blob) : null;
  }

  listCredentials(): Credential[] {
    const creds = this.db.listCredentials();
    return creds.map((c) => ({
      id: c.id,
      service: assertValidCredentialService(c.service),
    }));
  }

  listProviders(): CredentialService[] {
    const creds = this.db.listCredentials();
    const services = creds.map((c) => assertValidCredentialService(c.service));
    return Array.from(new Set(services));
  }

  async listOpenAIModels(): Promise<OpenAIModelInformation[]> {
    const apiKey = this.getCredential('openai');
    if (!apiKey) return [];

    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!modelsResponse.ok) {
      return [];
    }

    const models = (await modelsResponse.json()) as OpenAIModelListResponse;
    return filterAndSortOpenAIModels(models.data);
  }
}

function filterAndSortOpenAIModels(models: OpenAIModelInformation[]): OpenAIModelInformation[] {
  const resultModels: OpenAIModelInformation[] = [];
  const avoidTerm = [
    'audio',
    'realtime',
    'image',
    'trasncribe',
    'search',
    'tts',
    '-20',
    'omni',
    'gpt-3.5',
    'preview',
    'transcribe',
  ];
  const gptModels = models
    .filter(
      (model) => model.id.startsWith('gpt') && !avoidTerm.some((term) => model.id.includes(term)),
    )
    .sort((a, b) => b.id.localeCompare(a.id));

  const oModels = models
    .filter(
      (model) => model.id.startsWith('o') && !avoidTerm.some((term) => model.id.includes(term)),
    )
    .sort((a, b) => b.id.localeCompare(a.id));

  resultModels.push(...gptModels, ...oModels);

  return resultModels;
}

export interface OpenAIModelListResponse {
  data: OpenAIModelInformation[];
}

export interface OpenAIModelInformation {
  id: string;
}

export interface Credential {
  id: string;
  service: CredentialService;
}

const VALID_SERVICES = ['github', 'anthropic', 'openai', 'tavily'] as const;

export type CredentialService = (typeof VALID_SERVICES)[number];

export function isCredentialService(service: string): service is CredentialService {
  return VALID_SERVICES.includes(service as CredentialService);
}

export function assertValidCredentialService(service: string): CredentialService {
  if (!isCredentialService(service)) {
    throw new Error(`Invalid credential service: ${service}`);
  }
  return service;
}
