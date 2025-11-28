import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { useChat } from '@ai-sdk/react';
import ElectronTransport from '@/model/api/electronTransport';
import { ChatMessage } from '@/components/ChatMessage';
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';

export const Route = createFileRoute('/')({
  component: App,
});

function useElectronChat() {
  return useChat({
    transport: new ElectronTransport(),
  });
}

function App() {
  const { messages, sendMessage, status } = useElectronChat();
  const [inputValue, setInputValue] = React.useState('');

  const handleSend = (message: PromptInputMessage) => {
    if (message.text.trim() === '') return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: message.text }] });
    setInputValue('');
  };

  const lastMessageIndex = React.useMemo(() => messages.length - 1, [messages.length]);

  return (
    <div className="min-h-0 h-full w-full flex flex-col">
      <Conversation>
        <ConversationContent>
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} isLast={index === lastMessageIndex} />
          ))}
        </ConversationContent>
      </Conversation>
      <div className="w-full p-8 flex shrink-0 gap-2 border-t">
        <PromptInput onSubmit={handleSend}>
          <PromptInputBody>
            <PromptInputTextarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex justify-end">
            <PromptInputSubmit disabled={!inputValue && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
