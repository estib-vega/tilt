import { InferUITools, tool, ToolSet } from 'ai';
import { z } from 'zod';
import WebSearch from './webSearch.js';

interface GenerateToolsParasm {
  useWebSearch: boolean;
  webSearch: WebSearch;
}

export function generateTools(params: GenerateToolsParasm) {
  const { useWebSearch, webSearch } = params;

  if (useWebSearch) {
    return generateWebTools(webSearch);
  }

  return undefined;
}

const WebSearchToolInputSchema = z.object({
  query: z
    .string()
    .min(1, 'Query must be at least 1 character long')
    .describe('The search query to look up on the web.'),
});

function generateWebTools(webSearch: WebSearch) {
  const tools = {
    searchWeb: tool({
      description: `
<description>
    Use this tool to perform a web search and retrieve recent and relevant information from the internet.
    The results are returned in xml-like format with <search-result>, <link-label>, and <result-content> tags.
    Results may include irrelevant or outdated information, so use discretion when incorporating them into your response.
</description>

<notes>
  - Use this tool to get recent information that may not be in the AI's training data.
  - Provide specific and relevant search queries to get the best results.
  - Use short and concise queries.
  - Prefer multiple specific queries over a single broad one.
</notes>
`.trim(),
      inputSchema: WebSearchToolInputSchema,
      execute: async ({ query }) => {
        return webSearch.search(query);
      },
    }),
  } satisfies ToolSet;

  return tools;
}

export type WebTools = ReturnType<typeof generateWebTools>;
export type WebToolsTypes = keyof WebTools;

export type AllTools = WebTools;

export type Tools = InferUITools<AllTools>;
