import type WebSearch from './webSearch.js';
import type { JsonDiffOutput } from '../model/but.js';
import { stringifyJsonChanges } from '../model/repository/changes.js';
import type { InferUITools, ToolSet } from 'ai';
import { tool } from 'ai';
import { z } from 'zod';
import { Bash, OverlayFs } from 'just-bash';
import { createBashTool } from 'bash-tool';

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

// review tools

interface GenerateReviewToolsParams {
  diff: () => JsonDiffOutput;
}

export async function generateReviewTools(params: GenerateReviewToolsParams) {
  const tools = {
    showDiff: tool({
      description: `
<description>
    Return the diff strings of the changes being reviewed.
</description>

<notes>
    - If a full path filter is given, only the diff of the file that matches will be returned.
    - If a partial path filter is given, only the diffs of the files that start with that filter will be returned.
</notes>
      `.trim(),
      inputSchema: ShowDiffToolInputSchema,
      execute: async ({ pathFilter }) => {
        const output = params.diff();
        const changes = output.changes.filter((change) => {
          if (pathFilter) {
            return change.path.startsWith(pathFilter);
          }
          return true;
        });

        return stringifyJsonChanges(changes);
      },
    }),
  } satisfies ToolSet;

  return tools;
}

const ShowDiffToolInputSchema = z.object({
  pathFilter: z
    .string()
    .optional()
    .describe(
      'Optional. Either a full or a partial path string to match the file changes against.',
    ),
});

export type GenericReviewTools = Awaited<ReturnType<typeof generateReviewTools>>;

interface GenerateBashToolsParams {
  repositoryPath: string;
}

export async function generateBashTools(params: GenerateBashToolsParams) {
  const overlay = new OverlayFs({ root: params.repositoryPath, readOnly: true });
  const sandbox = new Bash({ fs: overlay, cwd: overlay.getMountPoint() });
  const { tools } = await createBashTool({
    sandbox,
    destination: overlay.getMountPoint(),
  });

  return tools;
}

export type BashTools = Awaited<ReturnType<typeof generateBashTools>>;

export type AllReviewTools = GenericReviewTools & BashTools;

export type ReviewTools = InferUITools<AllReviewTools>;
