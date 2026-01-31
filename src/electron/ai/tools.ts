import type { InferUITools, ToolSet } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import type WebSearch from './webSearch.js';

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
    Returns a natural language answer based on recent web search results.
</description>

<notes>
  - Use detailed, specific queries to find accurate information.
</notes>
`.trim(),
      inputSchema: WebSearchToolInputSchema,
      execute: async ({ query }, { toolCallId }) => {
        return webSearch.search(query, toolCallId);
      },
    }),
  } satisfies ToolSet;

  return tools;
}

export type WebTools = ReturnType<typeof generateWebTools>;
export type WebToolsTypes = keyof WebTools;

export type AllTools = WebTools;

export type Tools = InferUITools<AllTools>;
