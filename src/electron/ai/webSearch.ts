import { tavily, type TavilyClient } from '@tavily/core';

export default class WebSearch {
  private tvly: TavilyClient;

  constructor(providedApiKey?: string) {
    const apiKey = providedApiKey ?? process.env.TAVILY_API_KEY;
    this.tvly = tavily({ apiKey });
  }

  async search(query: string): Promise<string> {
    const response = await this.tvly.search(query);

    return response.results
      .map(
        (res) => `
- ${res.title}: ${res.url}
  ${this.summarizeContentIfNeeded(res.content)}`,
      )
      .join('\n');
  }

  private summarizeContentIfNeeded(content: string): string {
    const maxLength = 1000; // Define a maximum length for content

    if (content.length <= maxLength) {
      return content; // No need to summarize
    }

    // Simple summarization logic (could be replaced with a more sophisticated approach)
    return content.slice(0, maxLength) + '... [truncated]';
  }
}
