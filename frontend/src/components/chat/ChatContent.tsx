import { ChatMessageInfo } from "@server/lib/llm";
import { ScrollArea } from "../ui/scroll-area";
import ChatMessage from "./ChatMessage";

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
    return <ChatMessage author="bot" content="" loading />;
  }

  return <ChatMessage author="bot" content={props.streamingMessage} />;
};
interface ChatContentProps extends StreamingChatMessageProps {
  messages: ChatMessageInfo[];
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
      </div>
    </ScrollArea>
  );
};

ChatContent.displayName = "ChatContent";

export default ChatContent;
