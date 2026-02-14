import type { ButStreamSummary, MessageChunkEvent, MessageEndEvent } from '@api/api';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { readUIMessageStream, type UIMessage, type UIMessageChunk } from 'ai';
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

export function useButDiffSummary() {
  const [messages, setMessages] = React.useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const start = React.useCallback(async (params: ButStreamSummary) => {
    setIsLoading(true);

    const stream = createDiffSummaryStream(params);
    for await (const msg of readUIMessageStream({ stream })) {
      setMessages((prev) => {
        // If this message already exists (matching id), replace it
        const idx = prev.findIndex((m) => m.id === msg.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = msg;
          return next;
        }
        // Otherwise append
        return [...prev, msg];
      });
    }

    setIsLoading(false);
  }, []);

  return { start, isLoading, messages };
}

function createDiffSummaryStream(params: ButStreamSummary): ReadableStream<UIMessageChunk> {
  const id = `${params.projectId}:${params.cliId}`;

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
