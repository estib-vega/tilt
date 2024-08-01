import { ChatMessageInfo } from "@server/lib/llm";

const ChatMessage = (props: ChatMessageInfo): JSX.Element => {
  const isUser = props.author === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`p-2 shadow-sm rounded-md ${isUser ? "bg-primary-foreground" : "bg-secondary"}`}
      >
        {props.content}
      </div>
    </div>
  );
};

ChatMessage.displayName = "ChatMessage";

export default ChatMessage;
