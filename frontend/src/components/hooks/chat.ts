import React from "react";
import { LLMChatGreeterParams, llmChatGreeting, llmGenerate } from "@/lib/api";
import { ChatMessageInfo } from "@server/lib/llm";
import { useMutation, useQuery } from "@tanstack/react-query";

function useChatGreeting(params: LLMChatGreeterParams): boolean {
  const { isLoading } = useQuery({
    queryKey: ["chatGreeting"],
    queryFn: () => llmChatGreeting(params),
    refetchOnWindowFocus: false,
  });

  return isLoading;
}

interface ChatHook {
  streamingMessage: string | undefined;
  isLoadingAnswer: boolean;
  messages: ChatMessageInfo[];
  onEnterInput: (value: string) => void;
  onStreamingMessage: (message: string) => void;
  onStreamingEnd: (fullResponse: string, context: number[]) => void;
}

export function useChat(): ChatHook {
  const [messages, setMessages] = React.useState<ChatMessageInfo[]>([]);
  const contextRef = React.useRef<number[] | undefined>(undefined);
  const [streamingMessage, setStreamingMessage] = React.useState<
    string | undefined
  >(undefined);

  const clearChat = () => {
    setMessages([]);
    setStreamingMessage(undefined);
  };

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
  };

  const isLoadingGreeting = useChatGreeting({
    onStart: clearChat,
    onMessage: onStreamingMessage,
    onEnd: onStreamingEnd,
  });

  const mutation = useMutation({
    mutationFn: llmGenerate,
  });

  const onEnterInput = (value: string) => {
    setMessages((prev) => [
      ...prev,
      {
        author: "user",
        content: value,
      },
    ]);

    mutation.mutate({
      prompt: value,
      context: contextRef.current,
      onMessage: onStreamingMessage,
      onEnd: onStreamingEnd,
    });
  };

  return {
    streamingMessage,
    isLoadingAnswer: mutation.isPending || isLoadingGreeting,
    messages,
    onEnterInput,
    onStreamingMessage,
    onStreamingEnd,
  };
}
