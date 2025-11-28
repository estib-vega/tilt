import type { UIMessage } from 'ai'
import type { JSX } from 'react'
import { Message, MessageContent, MessageResponse } from './ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from './ai-elements/reasoning'

type MessagePart = UIMessage['parts'][number]

export interface ChatMessageProps {
  isLast: boolean
  message: UIMessage
}

export function ChatMessage(props: ChatMessageProps): JSX.Element {
  const { message, isLast } = props
  return (
    <Message from={message.role}>
      <MessageContent>
        {message.parts.map((part, i) => (
          <ChatMessagePart key={i} part={part} isLastMessage={isLast} />
        ))}
      </MessageContent>
    </Message>
  )
}
interface ChatMessagePartProps {
  isLastMessage: boolean
  part: MessagePart
}

function ChatMessagePart(props: ChatMessagePartProps): JSX.Element {
  const { part, isLastMessage } = props

  switch (part.type) {
    case 'text':
      return <MessageResponse>{part.text}</MessageResponse>
    case 'step-start':
      return <></>
    case 'reasoning': {
      const isStreaming = part.state === 'streaming' && isLastMessage
      return (
        <Reasoning className="w-full" isStreaming={isStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{part.text}</ReasoningContent>
        </Reasoning>
      )
    }

    default:
      return <pre className="text-xs">{JSON.stringify(part, null, 2)}</pre>
  }
}
