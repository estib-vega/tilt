import type { JSX } from 'react';
import { MessageResponse } from './ai-elements/message';

interface ChatMessageResponseProps {
  content: string;
  streaming: boolean;
}

export default function ChatMessageResponse(props: ChatMessageResponseProps): JSX.Element {
  const { content } = props;
  const mode = props.streaming ? 'streaming' : 'static';
  return (
    <div className="min-w-0 w-full">
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
    </div>
  );
}
