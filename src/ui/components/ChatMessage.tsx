import type { JSX } from 'react';
import { Message, MessageContent, MessageResponse } from './ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './ai-elements/reasoning';
import React from 'react';
import type { CustomUIMessage } from '@api/api';
import ChatTool from './ChatTool';

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
        <Message from={message.role} key={`message-part-${i}`}>
          <MessageContent>
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
      return <div className="px-7">{children}</div>;
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
      return <ChatTool chatId={props.chatId} toolPart={part} />;
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

interface ChatMessageResponseProps {
  content: string;
  streaming: boolean;
}

function ChatMessageResponse(props: ChatMessageResponseProps): JSX.Element {
  const { content } = props;
  const mode = props.streaming ? 'streaming' : 'static';
  return (
    <MessageResponse
      shikiTheme={['light-plus', 'dark-plus']}
      mode={mode}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </MessageResponse>
  );
}
