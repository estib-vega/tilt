import { isConnectionRefusedError } from '../utils/error.js';
import { Config, Ollama } from 'ollama';

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
