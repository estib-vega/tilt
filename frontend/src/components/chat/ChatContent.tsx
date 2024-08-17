import { MessageRole } from "@server/lib/ai/chatStreamGeneration";
import { ScrollArea } from "../ui/scroll-area";
import ChatMessage from "./ChatMessage";
import { ChatMessages } from "@server/lib/ai/llm";

interface StreamingChatMessageProps {
  streamingMessage: string | undefined;
  isLoadingAnswer: boolean;
}

const StreamingChatMessage = (
  props: StreamingChatMessageProps
): JSX.Element => {
  if (!props.streamingMessage && !props.isLoadingAnswer) {
    return <></>;
  }

  if (!props.streamingMessage) {
    return <ChatMessage role={MessageRole.Assistant} content="" loading />;
  }

  return (
    <ChatMessage
      role={MessageRole.Assistant}
      content={props.streamingMessage}
    />
  );
};
interface ChatContentProps extends StreamingChatMessageProps {
  messages: ChatMessages;
}

const ChatContent = (props: ChatContentProps): JSX.Element => {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 mr-4">
        {props.messages.map((m, i) => (
          <ChatMessage {...m} key={i} />
        ))}
        <StreamingChatMessage
          streamingMessage={props.streamingMessage}
          isLoadingAnswer={props.isLoadingAnswer}
        />
        <div className="h-40" />
      </div>
    </ScrollArea>
  );
};

ChatContent.displayName = "ChatContent";

export default ChatContent;
