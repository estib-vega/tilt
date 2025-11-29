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
  chatId: string;
}

export default function Chat(props: ChatProps): JSX.Element {
  const { chatId } = props;
  const { messages, sendMessage, status } = useElectronChat(chatId);
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
