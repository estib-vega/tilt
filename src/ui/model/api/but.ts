import { useProjectsStore } from '@/store';
import type { ButStreamSummary, MessageChunkEvent, MessageEndEvent } from '@api/api';
import type { ProjectId } from '@api/db/tables/projects';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { readUIMessageStream, type UIMessageChunk } from 'ai';
import React from 'react';

const butStatusOptions = (projectId: ProjectId) =>
  queryOptions({
    queryKey: ['but-status', projectId],
    queryFn: () => window.api.butStatus({ projectId }),
  });

export function useButStatus(projectId: ProjectId) {
  const options = butStatusOptions(projectId);
  return useSuspenseQuery(options);
}

const butDiffOptions = (projectId: ProjectId, cliId: string) =>
  queryOptions({
    queryKey: ['but-diff', projectId, cliId],
    queryFn: () => window.api.butDiff({ projectId, cliId }),
  });

export function useButDiff(projectId: ProjectId, cliId: string) {
  const options = butDiffOptions(projectId, cliId);
  return useSuspenseQuery(options);
}

export function useButDiffSummary(id: string) {
  const diffSummaries = useProjectsStore((state) => state.diffSummaries);
  const messages = React.useMemo(() => diffSummaries[id] ?? [], [diffSummaries, id]);
  const upsertSummaryMessage = useProjectsStore((state) => state.upsertSummaryMessage);
  const [isLoading, setIsLoading] = React.useState(false);

  const start = React.useCallback(
    async (params: ButStreamSummary) => {
      setIsLoading(true);

      const stream = createDiffSummaryStream(id, params);
      for await (const msg of readUIMessageStream({ stream })) {
        upsertSummaryMessage(id, msg);
      }

      setIsLoading(false);
    },
    [id, upsertSummaryMessage],
  );

  return { start, isLoading, messages };
}

function createDiffSummaryStream(
  id: string,
  params: ButStreamSummary,
): ReadableStream<UIMessageChunk> {
  const stream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      // incoming token chunks
      const onChunk = (data: MessageChunkEvent) => {
        if (data.id !== id) return;
        controller.enqueue(data.chunk);
      };

      const onEnd = (data: MessageEndEvent) => {
        if (data.id !== id) return;
        controller.close();
        cleanup();
      };

      const cleanUpChunk = window.api.onButSummarizationChunk(onChunk);
      const cleanUpEnd = window.api.onButSummarizationEnd(onEnd);

      // Clean up
      const cleanup = () => {
        cleanUpChunk();
        cleanUpEnd();
      };

      // trigger backend stream
      window.api.butSummarizeDiffStart(params);
    },
  });

  return stream;
}
