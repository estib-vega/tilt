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
  Search the web for up-to-date information to include in AI responses.
</description>

<notes>
  - Use this tool to get recent information that may not be in the AI's training data.
  - Provide specific and relevant search queries to get the best results.
  - Use short and concise queries.
  - Prefer multiple specific searches over a single broad one.
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
