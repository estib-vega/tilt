import { isConnectionRefusedError } from '../utils/error.js';
import type { Config } from 'ollama';
import { Ollama } from 'ollama';

export default class OllamaManager {
  private static instance: OllamaManager | undefined;
  private ollama: Ollama;

  private constructor(config?: Partial<Config>) {
    this.ollama = new Ollama(config);
  }

  static getInstance(config?: Partial<Config>): OllamaManager {
    if (!OllamaManager.instance) {
      OllamaManager.instance = new OllamaManager(config);
    }
    return OllamaManager.instance;
  }

  destroy() {
    OllamaManager.instance = undefined;
  }

  async getStatus(): Promise<OllamaStatus> {
    try {
      const response = await this.ollama.version();
      return { type: 'available', version: response.version };
    } catch (error) {
      if (isConnectionRefusedError(error)) {
        return { type: 'unavailable' };
      } else {
        return { type: 'error', message: (error as Error).message };
      }
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const { models } = await this.ollama.list();
      return models.map((model) => model.name);
    } catch (error) {
      if (isConnectionRefusedError(error)) {
        console.error('Error connecting to Ollama server');
      } else {
        console.error('Error listing Ollama models:', error);
      }
      return [];
    }
  }
}

interface BaseOllamaStatus {
  type: 'available' | 'unavailable' | 'error';
}

interface AvailableStatus extends BaseOllamaStatus {
  type: 'available';
  version: string;
}

interface UnavailableStatus extends BaseOllamaStatus {
  type: 'unavailable';
}

interface ErrorStatus extends BaseOllamaStatus {
  type: 'error';
  message: string;
}

export type OllamaStatus = AvailableStatus | UnavailableStatus | ErrorStatus;
