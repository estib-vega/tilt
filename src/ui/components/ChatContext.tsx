import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from '@/components/ai-elements/context';
import { useChatUsage } from '@/model/api/chat';
import type { JSX } from 'react';
import React from 'react';

interface ChatContextProps {
  chatId: string;
}

export default function ChatContex(props: ChatContextProps): JSX.Element {
  const usage = useChatUsage(props.chatId);

  const usedTokens = React.useMemo(() => {
    return (
      (usage?.inputTokens ?? 0) +
      (usage?.outputTokens ?? 0) +
      (usage?.reasoningTokens ?? 0) +
      (usage?.cachedInputTokens ?? 0)
    );
  }, [usage]);

  if (!usage) {
    return <></>;
  }

  return (
    <Context
      maxTokens={128_000}
      usage={{
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        cachedInputTokens: usage.cachedInputTokens,
        reasoningTokens: usage.reasoningTokens,
      }}
      usedTokens={usedTokens}
    >
      <ContextTrigger />
      <ContextContent>
        <ContextContentHeader />
        <ContextContentBody>
          <ContextInputUsage />
          <ContextOutputUsage />
          <ContextReasoningUsage />
          <ContextCacheUsage />
        </ContextContentBody>
        <ContextContentFooter />
      </ContextContent>
    </Context>
  );
}
