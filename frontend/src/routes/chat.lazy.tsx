import { createLazyFileRoute } from "@tanstack/react-router";
import ChatInput from "@/components/chat/ChatInput";
import ChatContent from "@/components/chat/ChatContent";
import React from "react";
import { ChatMessageInfo } from "@server/lib/llm";
import { llmGenerate } from "@/lib/api";

export const Route = createLazyFileRoute("/chat")({
  component: Chat,
});

function Chat() {
  const [messages, setMessages] = React.useState<ChatMessageInfo[]>([]);
  const contextRef = React.useRef<number[] | undefined>(undefined);
  const [isLoadingAnswer, setIsLoadingAnswer] = React.useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = React.useState<
    string | undefined
  >(undefined);

  const onStreamingMessage = (message: string) => {
    setStreamingMessage((prev) => (prev ? prev + message : message));
  };

  const onStreamingEnd = (fullResponse: string, context: number[]) => {
    contextRef.current = context;
    setMessages((prev) => [
      ...prev,
      {
        author: "bot",
        content: fullResponse,
      },
    ]);
    setStreamingMessage(undefined);
    setIsLoadingAnswer(false);
  };

  const onEnterInput = async (value: string) => {
    setIsLoadingAnswer(true);
    setMessages((prev) => [
      ...prev,
      {
        author: "user",
        content: value,
      },
    ]);

    await llmGenerate({
      prompt: value,
      context: contextRef.current,
      onMessage: onStreamingMessage,
      onEnd: onStreamingEnd,
    });
  };

  return (
    <div className="h-full flex flex-col flex-grow-0 overflow-hidden">
      <div className="container flex-grow overflow-hidden">
        <ChatContent streamingMessage={streamingMessage} messages={messages} />
      </div>
      <div className="container flex-shrink-0">
        <ChatInput disabled={isLoadingAnswer} onEnterInput={onEnterInput} />
      </div>
    </div>
  );
}
