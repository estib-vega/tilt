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
      (usage?.usage.inputTokens ?? 0) +
      (usage?.usage.outputTokens ?? 0) +
      (usage?.usage.reasoningTokens ?? 0) +
      (usage?.usage.cachedInputTokens ?? 0)
    );
  }, [usage?.usage]);

  if (!usage) {
    return <></>;
  }

  return (
    <Context
      maxTokens={128_000}
      modelId={usage.provider + ':' + usage.name}
      usage={{
        inputTokens: usage.usage.inputTokens,
        outputTokens: usage.usage.outputTokens,
        totalTokens: usage.usage.totalTokens,
        cachedInputTokens: usage.usage.cachedInputTokens,
        reasoningTokens: usage.usage.reasoningTokens,
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
