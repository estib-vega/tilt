import { useElectronChat } from '@/model/api/chat';
import React, { type JSX } from 'react';
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from './ai-elements/prompt-input';
import { Conversation, ConversationContent } from './ai-elements/conversation';
import { ChatMessage } from './ChatMessage';
import type { ChatStatus } from 'ai';
import NewChatButton from './NewChatButton';
import { GlobeIcon } from 'lucide-react';

export interface ChatProps {
  chatId: string | undefined;
}

export default function Chat(props: ChatProps): JSX.Element {
  if (props.chatId) {
    return (
      <React.Suspense fallback={<ChatSkeleton />}>
        <InitializedChat chatId={props.chatId} />
      </React.Suspense>
    );
  }

  return <NewChat />;
}

function NewChat(): JSX.Element {
  return (
    <div className="min-h-0 h-full w-full flex justify-center items-center border-l border-t rounded-tl-md">
      <div className="w-full flex flex-col items-center justify-start gap-2">
        <NewChatButton label="start a new chat" />
        <p className="text-sm text-muted-foreground">i mean, that's the whole point</p>
      </div>
    </div>
  );
}

interface InitializedChatProps {
  chatId: string;
}

function InitializedChat(props: InitializedChatProps): JSX.Element {
  const { chatId } = props;
  const { messages, sendMessage, status, stop } = useElectronChat(chatId);
  const [inputValue, setInputValue] = React.useState('');
  const [useWebSearch, setUseWebSearch] = React.useState<boolean>(false);

  const handleSend = (message: PromptInputMessage) => {
    if (message.text.trim() === '') return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: message.text }] }, useWebSearch);
    setInputValue('');
  };

  const lastMessageIndex = React.useMemo(() => messages.length - 1, [messages.length]);

  return (
    <div className="min-h-0 h-full w-full flex flex-col border-l border-t rounded-tl-md overflow-hidden">
      <Conversation>
        <ConversationContent className="overflow-y-auto">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} isLast={index === lastMessageIndex} />
          ))}
        </ConversationContent>
      </Conversation>
      <div className="w-full p-4 flex shrink-0 gap-2 border-t">
        <ChatInput
          handleSend={handleSend}
          stop={stop}
          inputValue={inputValue}
          setInputValue={setInputValue}
          status={status}
          useWebSearch={useWebSearch}
          setUseWebSearch={setUseWebSearch}
        />
      </div>
    </div>
  );
}

interface ChatInputProps {
  handleSend: (message: PromptInputMessage) => void;
  stop: () => Promise<void>;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  useWebSearch: boolean;
  setUseWebSearch: React.Dispatch<React.SetStateAction<boolean>>;
  status: ChatStatus;
}

function ChatInput(props: ChatInputProps): JSX.Element {
  const { handleSend, stop, inputValue, setInputValue, status, useWebSearch, setUseWebSearch } =
    props;
  return (
    <PromptInput onSubmit={handleSend} onAbort={stop}>
      <PromptInputBody>
        <PromptInputTextarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      </PromptInputBody>
      <PromptInputFooter className="flex justify-between">
        <div>
          <PromptInputButton
            onClick={() => setUseWebSearch((prev) => !prev)}
            variant={useWebSearch ? 'default' : 'ghost'}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
        </div>
        <PromptInputSubmit
          disabled={!inputValue && !status}
          status={status}
          className="cursor-pointer"
        />
      </PromptInputFooter>
    </PromptInput>
  );
}

/**
 * Skeleton component displayed while the Chat component is loading.
 */
function ChatSkeleton() {
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
