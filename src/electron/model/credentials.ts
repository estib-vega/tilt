import DB from '@api/db/sqlite';
import { decryptString, encryptString } from '../utils/safeStorage.js';
import { randomUUID } from 'crypto';

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
