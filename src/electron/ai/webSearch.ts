import Navigator, { SearchResult } from '@api/model/navigator';
import { generateText, LanguageModel } from 'ai';
import { promptForWebResultsSummary, systemPromptForWebResultsSummary } from './prompt.js';

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

    const results = await this.navigator.getSearchResults(query);

    this.emitter(callId, {
      type: 'received-results',
      timestamp: Date.now(),
      results,
    });

    const fetchContent = async (res: SearchResult): Promise<string | null> => {
      const content = await this.navigator.getTextContentFromUrl(res.href);
      if (!content) {
        return null;
      }

      return this.formatSearchResult(res, content);
    };

    const contentPromises = results.map((res) => fetchContent(res));
    const responses = await Promise.all(contentPromises).then((responses) =>
      responses.filter((res): res is string => res !== null),
    );

    this.emitter(callId, {
      type: 'processed-results',
      timestamp: Date.now(),
      processedResults: responses,
    });

    const result = responses.join('\n\n');
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
    const answer = await generateText({
      system,
      model: this.model,
      prompt,
    });

    return answer.text.trim();
  }

  private formatSearchResult(
    res: SearchResult,
    content: string,
  ): string | PromiseLike<string | null> | null {
    return `
  <search-result>
    <link-label>
      ${res.label}: ${res.href}
    </link-label>
    <result-content>
      ${this.summarizeContentIfNeeded(content)}
    </result-content>
  </search-result>`.trim();
  }

  private summarizeContentIfNeeded(content: string): string {
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
  processedResults: string[];
}

export interface WebSearchStartedSummarizationEvent extends BaseWebSearchEvent {
  type: 'started-summarization';
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
  | WebSearchCompletedSummarizationEvent
  | WebSearchErrorEvent
  | WebSearchEndEvent;
