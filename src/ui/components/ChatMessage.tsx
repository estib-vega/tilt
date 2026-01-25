import type { JSX } from 'react';
import { Message, MessageContent } from './ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './ai-elements/reasoning';
import React from 'react';
import type { CustomUIMessage } from '@api/api';
import ChatTool from './ChatTool';
import ChatMessageResponse from './ChatMessageResponse';

type MessagePart = CustomUIMessage['parts'][number];
type MessageRole = CustomUIMessage['role'];

export interface ChatMessageProps {
  chatId: string;
  isLast: boolean;
  message: CustomUIMessage;
}

export function ChatMessage(props: ChatMessageProps): JSX.Element {
  const { message, isLast } = props;
  return (
    <ChatMessageWrapper from={message.role}>
      {message.parts.map((part, i) => (
        <Message from={message.role} key={`message-part-${i}`} className=" min-w-0 w-full">
          <MessageContent className="min-w-0 w-full">
            <ChatMessagePart key={i} chatId={props.chatId} part={part} isLastMessage={isLast} />
          </MessageContent>
        </Message>
      ))}
    </ChatMessageWrapper>
  );
}

interface ChatMessageWrapperProps {
  from: MessageRole;
  children: React.ReactNode;
}

function ChatMessageWrapper(props: ChatMessageWrapperProps): React.ReactNode {
  const { from, children } = props;
  switch (from) {
    case 'user':
      return children;
    case 'system':
      return <Message from="system">{children}</Message>;
    case 'assistant':
      return <div className="min-w-0 w-full">{children}</div>;
  }
}

interface ChatMessagePartProps {
  chatId: string;
  isLastMessage: boolean;
  part: MessagePart;
}

function ChatMessagePart(props: ChatMessagePartProps): JSX.Element {
  const { part, isLastMessage } = props;

  switch (part.type) {
    case 'text':
      return <ChatMessageResponse content={part.text} streaming={part.state === 'streaming'} />;
    case 'step-start':
      return <></>;
    case 'tool-searchWeb':
      return (
        <div className="min-w-0 w-full">
          <ChatTool chatId={props.chatId} toolPart={part} />
        </div>
      );
    case 'reasoning': {
      const isStreaming = part.state === 'streaming' && isLastMessage;

      return (
        <Reasoning className="w-full" isStreaming={isStreaming}>
          <ReasoningTrigger />
          <div className="max-h-20 overflow-scroll flex flex-col-reverse">
            <ReasoningContent>{part.text}</ReasoningContent>
          </div>
        </Reasoning>
      );
    }

    default:
      return <pre className="text-xs">{JSON.stringify(part, null, 2)}</pre>;
  }
}
