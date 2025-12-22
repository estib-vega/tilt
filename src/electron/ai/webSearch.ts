import Navigator, { SearchResult } from '@api/model/navigator';

const MAX_CONTENT_LENGTH = 10000;

export default class WebSearch {
  constructor(private navigator: Navigator) {}

  async search(query: string): Promise<string> {
    const results = await this.navigator.getSearchResults(query);
    const fetchContent = async (res: SearchResult): Promise<string | null> => {
      const content = await this.navigator.getTextContentFromUrl(res.href);
      if (!content) {
        return null;
      }

      return `
<search-result>
  <link-label>
    ${res.label}: ${res.href}
  </link-label>
  <result-content>
    ${this.summarizeContentIfNeeded(content)}
  </result-content>
</search-result>`.trim();
    };

    const contentPromises = results.map((res) => fetchContent(res));
    const responses = await Promise.all(contentPromises);
    const response = responses.filter((res): res is string => res !== null);

    return response.join('\n\n');
  }

  private summarizeContentIfNeeded(content: string): string {
    if (content.length <= MAX_CONTENT_LENGTH) {
      return content; // No need to summarize
    }

    // Simple summarization logic (could be replaced with a more sophisticated approach)
    return content.slice(0, MAX_CONTENT_LENGTH) + '... [truncated]';
  }
}
