import { MessageRole } from "@server/lib/chatStreamGeneration";
import MD from "../md/MD";
import { Skeleton } from "../ui/skeleton";
import { ItemOf } from "@/utils/typing";
import { ChatMessages } from "@server/lib/llm";

interface ChatMessageProps extends ItemOf<ChatMessages> {
  loading?: boolean;
}

const ChatMessage = (props: ChatMessageProps): JSX.Element => {
  const isUser = props.role === MessageRole.User;

  if (props.loading)
    return <Skeleton className="w-44 h-8 bg-muted animate-appear-up" />;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 rounded-md text-primary ${isUser ? "border-primary-foreground border-2 animate-appear-up" : "bg-secondary shadow-sm shadow-border"}`}
      >
        <MD content={props.content} />
      </div>
    </div>
  );
};

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
