import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from './ai-elements/prompt-input';
import { Conversation, ConversationContent } from './ai-elements/conversation';
import { ReivewMessage } from './ChatMessage';
import ConfigureModelsButton from './ConfigureModelsButton';
import ModelSelectorInputButton from './ModelSelectorInputButton';
import { Button } from './ui/button';
import type { ModelIdentifier } from '@api/ai/model';
import { useElectronReviewChat } from '@/model/api/chat';
import type { ProjectId } from '@api/db/tables/projects';
import React, { type JSX } from 'react';
import type { ChatStatus } from 'ai';
import { useModelSelector } from '@/model/api/models';
import { X } from 'lucide-react';
import { useProjectsStore } from '@/store';
import { extractFirstAssistantMessageText } from '@/model/messages';

interface ReviewChatProps {
  projectId: ProjectId;
  cliId: string;
  onClose: () => void;
}

export default function ReviewChat(props: ReviewChatProps) {
  const { projectId, cliId } = props;
  const id = `${projectId}:${cliId}`;
  const { messages, sendMessage, status, error } = useElectronReviewChat();
  const [inputValue, setInputValue] = React.useState('');
  const diffSummaries = useProjectsStore((state) => state.diffSummaries);
  const summary = React.useMemo(() => diffSummaries[id] ?? [], [diffSummaries, id]);

  const handleSend = (message: PromptInputMessage, modelIdentifier: ModelIdentifier): boolean => {
    switch (status) {
      case 'error':
        return false;
      case 'streaming':
        stop();
        return false;
      case 'ready': {
        if (message.text.trim() === '') return false;
        sendMessage(
          { role: 'user', parts: [{ type: 'text', text: message.text }] },
          modelIdentifier,
          projectId,
          cliId,
          extractFirstAssistantMessageText(summary),
        );
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
    <div className="min-h-0 h-full w-full flex flex-col border-l overflow-hidden">
      <div className="w-full flex p-2">
        <Button className="rounded-full cursor-pointer w-8 h-8" onClick={props.onClose}>
          <X size={14} />
        </Button>
      </div>
      <Conversation>
        <ConversationContent className="min-w-0 w-full">
          {messages.map((message, index) => (
            <ReivewMessage key={index} message={message} isLast={index === lastMessageIndex} />
          ))}
        </ConversationContent>
      </Conversation>
      <div className="w-full p-4 flex flex-col shrink-0 gap-2 border-t">
        {error && (
          <div className="py-1 px-2 bg-red-100 text-red-800 rounded-md">
            <p className="text-sm font-semibold">{error.name}</p>
            <p className="text-xs">{error.message}</p>
          </div>
        )}
        <React.Suspense>
          <ReviewChatInput
            id={id}
            handleSend={handleSend}
            inputValue={inputValue}
            setInputValue={setInputValue}
            status={status}
          />
        </React.Suspense>
      </div>
    </div>
  );
}

interface ReviewChatInputProps {
  id: string;
  handleSend: (message: PromptInputMessage, modelIdentifier: ModelIdentifier) => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  status: ChatStatus;
}

function ReviewChatInput(props: ReviewChatInputProps): JSX.Element {
  const { handleSend, inputValue, setInputValue, status, id } = props;
  const modelSelectorHook = useModelSelector(id);

  if (modelSelectorHook.selectedModel === null) {
    return (
      <div className="flex gap-2 items-center justify-center">
        <p className="font-semibold text-sm">no models available</p>
        <ConfigureModelsButton />
      </div>
    );
  }

  const selectedModel = modelSelectorHook.selectedModel;

  return (
    <PromptInput onSubmit={(message) => handleSend(message, selectedModel)}>
      <PromptInputBody>
        <PromptInputTextarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      </PromptInputBody>
      <PromptInputFooter className="flex justify-between">
        <div className="flex gap-2">
          <React.Suspense>
            <ModelSelectorInputButton {...modelSelectorHook} selectedModel={selectedModel} />
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
