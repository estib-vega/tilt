import { ChatMessageInfo } from "@server/lib/llm";
import { ScrollArea } from "../ui/scroll-area";
import ChatMessage from "./ChatMessage";

interface ChatContentProps {
  streamingMessage: string | undefined;
  messages: ChatMessageInfo[];
}

const ChatContent = (props: ChatContentProps): JSX.Element => {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4">
        {props.messages.map((m, i) => (
          <ChatMessage {...m} key={i} />
        ))}
        {props.streamingMessage && (
          <ChatMessage author="bot" content={props.streamingMessage} />
        )}
      </div>
    </ScrollArea>
  );
};

ChatContent.displayName = "ChatContent";

export default ChatContent;
