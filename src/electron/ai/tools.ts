import type WebSearch from './webSearch.js';
import type { JsonChange, JsonDiffOutput } from '../model/but.js';
import { stringifyJsonChanges } from '../model/repository/changes.js';
import { promptForChangeAgent } from './prompt.js';
import type { InferUITools, ToolLoopAgent, ToolSet, UIMessage } from 'ai';
import { readUIMessageStream, tool } from 'ai';
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
    - If a path filter(s) is given, only the diffs of the files that contain ANY of the passed filter strings in their path will be returned.
    - If a constent filter(s) is given, only the diffs of the file changes that contain ANY of the passed filter string in the content will be returned.
</notes>
      `.trim(),
      inputSchema: ShowDiffToolInputSchema,
      execute: async ({ pathFilters, contentFilters }) => {
        const output = params.diff();
        const changes = output.changes.filter((change) => {
          if (pathFilters && pathFilters.length > 0) {
            return pathFilters.some(
              (f) =>
                change.path.toLowerCase().includes(f.toLocaleLowerCase()) ||
                change.oldPath?.toLowerCase().includes(f.toLowerCase()),
            );
          }
          return true;
        });

        const contentFilteredChanges: JsonChange[] = [];
        if (contentFilters && contentFilters.length > 0) {
          for (const change of changes) {
            if (change.diff.type !== 'patch') continue;
            const hunks = change.diff.hunks.filter((h) => {
              return contentFilters.some((f) => h.diff.toLowerCase().includes(f.toLowerCase()));
            });

            if (hunks.length === 0) continue;

            contentFilteredChanges.push({
              ...change,
              diff: {
                ...change.diff,
                hunks,
              },
            });
          }
        } else {
          contentFilteredChanges.push(...changes);
        }

        return stringifyJsonChanges(contentFilteredChanges);
      },
    }),
  } satisfies ToolSet;

  return tools;
}

const ShowDiffToolInputSchema = z.object({
  pathFilters: z
    .string()
    .array()
    .optional()
    .describe(
      'Optional. One or multiple string values to match against the file paths of the changes being reviewed.',
    ),
  contentFilters: z
    .string()
    .array()
    .optional()
    .describe('Optional. One or multiple terms to search against the content of the change diffs.'),
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

export interface GenerateChangeTool {
  changeAgent: ToolLoopAgent<never, GenericReviewTools, never>;
  diffSummary: string | null;
}

export function generateChangeTool(params: GenerateChangeTool) {
  const toolset = {
    changesQuery: tool({
      description: `
<description>
  Ask a question about the code changes being reviewed.
</description>

<notes>
  - The question should be a full sentence.
  - Prefer multiple focused questions than one big one.
</notes>
`,
      inputSchema: ChangeQueryInputSchema,
      execute: async function* ({ query }) {
        const result = await params.changeAgent.stream({
          prompt: promptForChangeAgent(query, params.diffSummary),
        });

        // Each iteration yields a complete, accumulated UIMessage
        for await (const message of readUIMessageStream({
          stream: result.toUIMessageStream(),
        })) {
          yield message;
        }
      },
      toModelOutput: ({ output }) => {
        const message: UIMessage = output;
        const text = findLastTextPart(message);
        return {
          type: 'text',
          value: text ?? 'Task completed.',
        };
      },
    }),
  } satisfies ToolSet;

  return toolset;
}

const ChangeQueryInputSchema = z.object({
  query: z.string().describe('A question about the code changes being reviewed.'),
});

export type ChangeTools = ReturnType<typeof generateChangeTool>;

export type AllReviewTools = GenericReviewTools & BashTools & ChangeTools;

export type ReviewTools = InferUITools<AllReviewTools>;

function findLastTextPart(message: UIMessage): string | null {
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const part = message.parts[i];
    if (part.type === 'text') return part.text;
  }
  return null;
}
