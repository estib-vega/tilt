import { ChatMessageInfo } from "@server/lib/llm";
import MD from "../md/MD";
import { Skeleton } from "../ui/skeleton";

interface ChatMessageProps extends ChatMessageInfo {
  loading?: boolean;
}

const ChatMessage = (props: ChatMessageProps): JSX.Element => {
  const isUser = props.author === "user";

  if (props.loading)
    return <Skeleton className="w-44 h-8 bg-muted animate-appear-up" />;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 pb-0 shadow-sm shadow-border rounded-md text-primary ${isUser ? "bg-primary-foreground animate-appear-up" : "bg-secondary"}`}
      >
        <MD content={props.content} />
      </div>
    </div>
  );
};

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
