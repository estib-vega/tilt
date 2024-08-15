import ChatInput from "@/components/chat/ChatInput";
import ChatContent from "@/components/chat/ChatContent";
import { useChat } from "@/components/hooks/chat";

export default function Chat() {
  const chat = useChat();

  return (
    <div className="h-full flex flex-col flex-grow-0 overflow-hidden">
      <div className="container flex-grow overflow-hidden">
        {chat.chatTitle && (
          <h1 className="text-xl sm:text-2xl py-2 sm:py-4 text-primary">
            {chat.chatTitle}
          </h1>
        )}
        <ChatContent
          streamingMessage={chat.streamingMessage}
          messages={chat.messages}
          isLoadingAnswer={chat.isLoadingAnswer}
        />
      </div>
      <div className="container flex-shrink-0">
        <ChatInput
          disabled={chat.isLoadingAnswer}
          onEnterInput={chat.onEnterInput}
        />
      </div>
    </div>
  );
}
