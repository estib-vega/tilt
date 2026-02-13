import { promptForWebResultsSummary, systemPromptForWebResultsSummary } from './prompt.js';
import type { SearchResult, WebPageContents } from '@api/model/navigator/index.js';
import type Navigator from '@api/model/navigator/index.js';
import type { LanguageModel } from 'ai';
import { streamText } from 'ai';

const MAX_CONTENT_LENGTH = 10000;

export default class WebSearch {
  constructor(
    private navigator: Navigator,
    private model: LanguageModel,
    private emitter: WebSearchEventListener,
  ) {}

  async search(query: string, callId: string): Promise<string> {
    this.emitter(callId, {
      type: 'start',
      timestamp: Date.now(),
      query,
    });

    let results: SearchResult[] = [];
    try {
      results = await this.navigator.getSearchResults(query);
    } catch (error) {
      this.emitter(callId, {
        type: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error : String(error),
      });
      this.emitter(callId, {
        type: 'end',
        timestamp: Date.now(),
      });
      throw error;
    }

    this.emitter(callId, {
      type: 'received-results',
      timestamp: Date.now(),
      results,
    });

    const fetchContent = async (res: SearchResult): Promise<WebPageContents | null> => {
      const content = await this.navigator.getContentFromUrl(res.href);
      if (!content) {
        return null;
      }
      const text = this.formatSearchResult(res, content.text);

      if (!text) {
        return null;
      }

      return {
        ...content,
        text,
      };
    };

    const contentPromises = results.map((res) => fetchContent(res));
    const responses = await Promise.all(contentPromises).then((responses) =>
      responses.filter((res): res is WebPageContents => res !== null),
    );

    this.emitter(callId, {
      type: 'processed-results',
      timestamp: Date.now(),
      processedResults: responses,
    });

    const result = responses.map((res) => res.text).join('\n\n');
    const answer = await this.answerQuery(callId, query, result);
    this.emitter(callId, {
      type: 'completed-summarization',
      timestamp: Date.now(),
      summary: answer,
    });

    this.emitter(callId, {
      type: 'end',
      timestamp: Date.now(),
    });

    return answer;
  }

  private async answerQuery(callId: string, query: string, results: string): Promise<string> {
    this.emitter(callId, {
      type: 'started-summarization',
      timestamp: Date.now(),
    });
    const system = systemPromptForWebResultsSummary();
    const prompt = promptForWebResultsSummary(query, results);
    const stream = await streamText({
      system,
      model: this.model,
      prompt,
    });

    for await (const chunk of stream.fullStream) {
      switch (chunk.type) {
        case 'text-delta': {
          const delta = chunk.text;
          this.emitter(callId, {
            type: 'delta-summarization',
            timestamp: Date.now(),
            delta,
          });
          break;
        }
        case 'reasoning-start': {
          this.emitter(callId, {
            type: 'delta-summarization',
            timestamp: Date.now(),
            delta: '**thiking**\n\n',
          });
          break;
        }
        case 'reasoning-end': {
          this.emitter(callId, {
            type: 'delta-summarization',
            timestamp: Date.now(),
            delta: '\n\n**done thinking**\n\n',
          });
          break;
        }
        case 'reasoning-delta': {
          const delta = chunk.text;
          this.emitter(callId, {
            type: 'delta-summarization',
            timestamp: Date.now(),
            delta,
          });
          break;
        }
        case 'error':
        case 'source':
        case 'tool-call':
        case 'tool-result':
        case 'tool-error':
        case 'text-start':
        case 'text-end':
        case 'tool-input-start':
        case 'tool-input-end':
        case 'tool-input-delta':
        case 'file':
        case 'start-step':
        case 'finish-step':
        case 'start':
        case 'finish':
        case 'abort':
        case 'raw':
          continue;
      }
    }

    const answer = await stream.text;

    return answer.trim();
  }

  private formatSearchResult(res: SearchResult, content: string): string | null {
    return `
  <search-result>
    <link-label>
      ${res.label}: ${res.href}
    </link-label>
    <result-content>
      ${this.truncateContentIfNeeded(content)}
    </result-content>
  </search-result>`.trim();
  }

  private truncateContentIfNeeded(content: string): string {
    if (content.length <= MAX_CONTENT_LENGTH) {
      return content; // No need to summarize
    }

    // Simple summarization logic (could be replaced with a more sophisticated approach)
    return content.slice(0, MAX_CONTENT_LENGTH) + '... [truncated]';
  }
}

export type WebSearchEventListener = (callId: string, event: WebSearchEvent) => void;

interface BaseWebSearchEvent {
  type:
    | 'start'
    | 'received-results'
    | 'processed-results'
    | 'started-summarization'
    | 'delta-summarization'
    | 'completed-summarization'
    | 'error'
    | 'end';
  timestamp: number;
}
export interface WebSearchStartEvent extends BaseWebSearchEvent {
  type: 'start';
  query: string;
}

export interface WebSearchReceivedResultsEvent extends BaseWebSearchEvent {
  type: 'received-results';
  results: SearchResult[];
}

export interface WebSearchProcessedResultsEvent extends BaseWebSearchEvent {
  type: 'processed-results';
  processedResults: WebPageContents[];
}

export interface WebSearchStartedSummarizationEvent extends BaseWebSearchEvent {
  type: 'started-summarization';
}

export interface WebSearchDeltaSummarizationEvent extends BaseWebSearchEvent {
  type: 'delta-summarization';
  delta: string;
}

export interface WebSearchCompletedSummarizationEvent extends BaseWebSearchEvent {
  type: 'completed-summarization';
  summary: string;
}

export interface WebSearchErrorEvent extends BaseWebSearchEvent {
  type: 'error';
  error: Error | string;
}

export interface WebSearchEndEvent extends BaseWebSearchEvent {
  type: 'end';
}

export type WebSearchEvent =
  | WebSearchStartEvent
  | WebSearchReceivedResultsEvent
  | WebSearchProcessedResultsEvent
  | WebSearchStartedSummarizationEvent
  | WebSearchDeltaSummarizationEvent
  | WebSearchCompletedSummarizationEvent
  | WebSearchErrorEvent
  | WebSearchEndEvent;
