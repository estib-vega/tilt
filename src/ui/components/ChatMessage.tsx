import { Message, MessageContent } from './ai-elements/message';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './ai-elements/reasoning';
import ChatTool from './ChatTool';
import ChatMessageResponse from './ChatMessageResponse';
import ReviewChatTool from './ReviewChatTool';
import React from 'react';
import type { CustomUIMessage, ReviewUIMessage } from '@api/api';
import type { JSX } from 'react';
import type { UIMessage } from 'ai';

type MessagePart = CustomUIMessage['parts'][number];
type MessageRole = CustomUIMessage['role'];

type GenericMessagePart = UIMessage['parts'][number];

type ReviewMessagePart = ReviewUIMessage['parts'][number];

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
export interface GenericMessageProps {
  isLast: boolean;
  message: UIMessage;
}

export function GenericMessage(props: GenericMessageProps): JSX.Element {
  const { message, isLast } = props;
  return (
    <ChatMessageWrapper from={message.role}>
      {message.parts.map((part, i) => (
        <Message from={message.role} key={`message-part-${i}`} className=" min-w-0 w-full">
          <MessageContent className="min-w-0 w-full">
            <GenericMessagePartComponent key={i} part={part} isLastMessage={isLast} />
          </MessageContent>
        </Message>
      ))}
    </ChatMessageWrapper>
  );
}
export interface ReviewMessageProps {
  isLast: boolean;
  message: ReviewUIMessage;
}

export function ReivewMessage(props: ReviewMessageProps): JSX.Element {
  const { message, isLast } = props;
  return (
    <ChatMessageWrapper from={message.role}>
      {message.parts.map((part, i) => (
        <Message from={message.role} key={`message-part-${i}`} className=" min-w-0 w-full">
          <MessageContent className="min-w-0 w-full">
            <ReviewMessagePartComponent key={i} part={part} isLastMessage={isLast} />
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

interface GenericMessagePartProps {
  isLastMessage: boolean;
  part: GenericMessagePart;
}

function GenericMessagePartComponent(props: GenericMessagePartProps): JSX.Element {
  const { part, isLastMessage } = props;

  switch (part.type) {
    case 'text':
      return <ChatMessageResponse content={part.text} streaming={part.state === 'streaming'} />;
    case 'step-start':
      return <></>;
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

interface ReviewMessagePartProps {
  isLastMessage: boolean;
  part: ReviewMessagePart;
}

function ReviewMessagePartComponent(props: ReviewMessagePartProps): JSX.Element {
  const { part, isLastMessage } = props;

  switch (part.type) {
    case 'text':
      return <ChatMessageResponse content={part.text} streaming={part.state === 'streaming'} />;
    case 'step-start':
      return <></>;
    case 'tool-bash':
    case 'tool-readFile':
    case 'tool-showDiff':
    case 'tool-writeFile':
      return <ReviewChatTool toolPart={part} />;
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
