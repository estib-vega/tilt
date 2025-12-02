import type { JSX } from 'react';
import { Message, MessageContent, MessageResponse } from './ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './ai-elements/reasoning';
import React from 'react';
import type { CustomUIMessage } from '@api/api';
import ChatTool from './ChatTool';

type MessagePart = CustomUIMessage['parts'][number];
type MessageRole = CustomUIMessage['role'];

export interface ChatMessageProps {
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
            <ChatMessagePart key={i} part={part} isLastMessage={isLast} />
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
      return <ChatTool toolPart={part} />;
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
      shikiTheme={['dark-plus', 'github-light']}
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
        p: ({ children }) => <p className="mb-4">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1 list-disc">{children}</li>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
      }}
    >
      {content}
    </MessageResponse>
  );
}
