import { createChatMutation, useElectronChat } from '@/model/api/chat';
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
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from './ai-elements/model-selector';
import { Conversation, ConversationContent } from './ai-elements/conversation';
import { ChatMessage } from './ChatMessage';
import type { ChatStatus } from 'ai';
import { CheckIcon, GlobeIcon } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { useListModelsGroupedByProvider } from '@/model/api/model';
import type { ModelId } from '@api/ai/model';

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
  const navigation = useNavigate();
  const createChat = createChatMutation();
  const [inputValue, setInputValue] = React.useState('');
  const [useWebSearch, setUseWebSearch] = React.useState<boolean>(false);

  const handleSend = async (message: PromptInputMessage): Promise<void> => {
    if (message.text.trim() === '') return;
    const chatId = await createChat.mutateAsync([
      { parts: [{ type: 'text', text: message.text }] },
    ]);
    return navigation({ to: '/chat', search: { chatId } });
  };

  return (
    <div className="min-h-0 h-full w-full flex justify-center items-center border-l border-t rounded-tl-md">
      <div className="max-w-3xl w-full p-4 flex flex-col items-center justify-start gap-4">
        <h1 className="text-3xl">ask away</h1>
        <ChatInput
          handleSend={handleSend}
          inputValue={inputValue}
          setInputValue={setInputValue}
          status="ready"
          useWebSearch={useWebSearch}
          setUseWebSearch={setUseWebSearch}
        />
        {/* TODO: Suggestions of what to search */}
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

  const handleSend = (message: PromptInputMessage): boolean => {
    switch (status) {
      case 'error':
        return false;
      case 'streaming':
        stop();
        return false;
      case 'ready': {
        if (message.text.trim() === '') return false;
        sendMessage({ role: 'user', parts: [{ type: 'text', text: message.text }] }, useWebSearch);
        setInputValue('');
        return true;
      }
      case 'submitted':
        // Waiting for the stream to start
        return false;
    }
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
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  useWebSearch: boolean;
  setUseWebSearch: React.Dispatch<React.SetStateAction<boolean>>;
  status: ChatStatus;
}

function ChatInput(props: ChatInputProps): JSX.Element {
  const { handleSend, inputValue, setInputValue, status, useWebSearch, setUseWebSearch } = props;
  return (
    <PromptInput onSubmit={handleSend}>
      <PromptInputBody>
        <PromptInputTextarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      </PromptInputBody>
      <PromptInputFooter className="flex justify-between">
        <div className="flex gap-2">
          <PromptInputButton
            onClick={() => setUseWebSearch((prev) => !prev)}
            variant={useWebSearch ? 'default' : 'ghost'}
          >
            <GlobeIcon size={16} />
            <span>search</span>
          </PromptInputButton>
          <React.Suspense>
            <ModelSelectorInputButton />
          </React.Suspense>
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

function ModelSelectorInputButton(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const groupedModels = useListModelsGroupedByProvider();
  const [selectedModel, setSelectedModel] = React.useState<ModelId | null>(null);

  const selectedModelData = React.useMemo(() => {
    const allModels = groupedModels.flatMap(([_, models]) => models);
    return allModels.find((model) => model.id === selectedModel) || null;
  }, [groupedModels, selectedModel]);

  return (
    <div>
      <ModelSelector onOpenChange={setOpen} open={open}>
        <ModelSelectorTrigger asChild>
          <Button className="justify-between" variant="outline">
            {selectedModelData && (
              <>
                <ModelSelectorLogo provider={selectedModelData.provider} />
                <ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
              </>
            )}
          </Button>
        </ModelSelectorTrigger>
        <ModelSelectorContent aria-describedby="model-selector-input">
          <ModelSelectorInput id="model-selector-input" placeholder="search models..." />
          <ModelSelectorList>
            <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
            {groupedModels.map(([provider, models]) => (
              <ModelSelectorGroup heading={provider} key={provider}>
                {models.map((model) => (
                  <ModelSelectorItem
                    key={model.id}
                    onSelect={() => {
                      setSelectedModel(model.id);
                      setOpen(false);
                    }}
                    value={model.id}
                  >
                    <ModelSelectorLogo provider={model.provider} />
                    <ModelSelectorName>{model.name}</ModelSelectorName>
                    {selectedModel === model.id ? (
                      <CheckIcon className="ml-auto size-4" />
                    ) : (
                      <div className="ml-auto size-4" />
                    )}
                  </ModelSelectorItem>
                ))}
              </ModelSelectorGroup>
            ))}
          </ModelSelectorList>
        </ModelSelectorContent>
      </ModelSelector>
    </div>
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
