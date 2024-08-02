import { createLazyFileRoute } from "@tanstack/react-router";
import ChatInput from "@/components/chat/ChatInput";
import ChatContent from "@/components/chat/ChatContent";
import { useChat } from "@/components/hooks/chat";

export const Route = createLazyFileRoute("/chat")({
  component: Chat,
});

function Chat() {
  const chat = useChat();

  return (
    <div className="h-full flex flex-col flex-grow-0 overflow-hidden">
      <div className="container flex-grow overflow-hidden pt-2">
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
