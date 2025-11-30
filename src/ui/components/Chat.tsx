import { useElectronChat } from '@/model/api/chat';
import React, { type JSX } from 'react';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from './ai-elements/prompt-input';
import { Conversation, ConversationContent } from './ai-elements/conversation';
import { ChatMessage } from './ChatMessage';

export interface ChatProps {
  chatId: string | undefined;
}

export default function Chat(props: ChatProps): JSX.Element {
  const { chatId } = props;
  const { messages, sendMessage, status, stop } = useElectronChat(chatId ?? 'default-chat-2');
  const [inputValue, setInputValue] = React.useState('');

  const handleSend = (message: PromptInputMessage) => {
    if (message.text.trim() === '') return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: message.text }] });
    setInputValue('');
  };

  const lastMessageIndex = React.useMemo(() => messages.length - 1, [messages.length]);

  return (
    <div className="min-h-0 h-full w-full flex flex-col border-l border-t rounded-tl-md">
      <Conversation>
        <ConversationContent>
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} isLast={index === lastMessageIndex} />
          ))}
        </ConversationContent>
      </Conversation>
      <div className="w-full p-4 flex shrink-0 gap-2 border-t">
        <PromptInput onSubmit={handleSend} onAbort={stop}>
          <PromptInputBody>
            <PromptInputTextarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex justify-end">
            <PromptInputSubmit
              disabled={!inputValue && !status}
              status={status}
              className="cursor-pointer"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
/**
 * Skeleton component displayed while the Chat component is loading.
 */
export function ChatSkeleton() {
  return (
    <div className="min-h-0 h-full w-full flex flex-col border-l border-t rounded-tl-md">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <ChatMessageSkeleton key={i} i={i} />
        ))}
      </div>
      <div className="w-full p-4 flex shrink-0 gap-2 border-t">
        <div className="w-full flex flex-col gap-2">
          <div className="h-[116px] bg-secondary rounded-md" />
        </div>
      </div>
    </div>
  );
}

function ChatMessageSkeleton(props: { i: number }) {
  const { i } = props;

  if (i % 2 === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
        <div className="h-16 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      <div className="h-16 bg-muted rounded animate-pulse" />
    </div>
  );
}
