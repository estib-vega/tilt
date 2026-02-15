import { useProjectsStore } from '@/store';
import type { ButStreamSummary, MessageChunkEvent, MessageEndEvent } from '@api/api';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { readUIMessageStream, type UIMessageChunk } from 'ai';
import React from 'react';

const butStatusOptions = (butPath: string, repositoryPath: string) =>
  queryOptions({
    queryKey: ['but-status', butPath, repositoryPath],
    queryFn: () => window.api.butStatus({ cwd: repositoryPath, binaryPath: butPath }),
  });

export function useButStatus(butPath: string, repositoryPath: string) {
  const options = butStatusOptions(butPath, repositoryPath);
  return useSuspenseQuery(options);
}

const butDiffOptions = (butPath: string, repositoryPath: string, cliId: string) =>
  queryOptions({
    queryKey: ['but-diff', butPath, repositoryPath, cliId],
    queryFn: () => window.api.butDiff({ cwd: repositoryPath, binaryPath: butPath, cliId }),
  });

export function useButDiff(butPath: string, repositoryPath: string, cliId: string) {
  const options = butDiffOptions(butPath, repositoryPath, cliId);
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
