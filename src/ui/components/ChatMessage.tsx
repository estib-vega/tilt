import type { ReasoningUIPart, UIMessage } from 'ai'
import type { JSX } from 'react'
import Markdown from './Markdown'

type MessagePart = UIMessage['parts'][number]

export interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage(props: ChatMessageProps): JSX.Element {
  const { message } = props
  return (
    <div className="w-full p-4 border-b last:border-0">
      <strong>{message.role}:</strong>{' '}
      {message.parts.map((part, i) => (
        <ChatMessagePart key={i} part={part} />
      ))}
    </div>
  )
}

interface ChatMessagePartProps {
  part: MessagePart
}

function ChatMessagePart(props: ChatMessagePartProps): JSX.Element {
  const { part } = props

  switch (part.type) {
    case 'text':
      console.log('Rendering markdown for part:', part.text)
      return <Markdown text={part.text} />
    case 'step-start':
      return <hr className="my-4 border-dashed" />
    case 'reasoning':
      return <ChatMessageReasoning part={part} />
    default:
      return <pre className="text-xs">{JSON.stringify(part, null, 2)}</pre>
  }
}

interface ChatMessageReasoningProps {
  part: ReasoningUIPart
}

function ChatMessageReasoning(props: ChatMessageReasoningProps): JSX.Element {
  const { part } = props
  if (part.state === 'streaming') {
    const content = part.text || 'Thinking...'
    return <span className="text-gray-500 animate-pulse">{content}</span>
  }

  return <span className="text-gray-500">{part.text}</span>
}
