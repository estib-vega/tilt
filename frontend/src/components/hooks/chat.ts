import React from "react";
import { llmChatGreeting, llmGenerate } from "@/lib/api";
import { ChatMessageInfo } from "@server/lib/llm";
import { useMutation, useQuery } from "@tanstack/react-query";

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

  const { isLoading } = useQuery({
    queryKey: ["chatGreeting"],
    queryFn: () =>
      llmChatGreeting({
        onStart: clearChat,
        onMessage: onStreamingMessage,
        onEnd: onStreamingEnd,
      }),
    refetchOnWindowFocus: false,
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
    isLoadingAnswer: mutation.isPending || isLoading,
    messages,
    onEnterInput,
    onStreamingMessage,
    onStreamingEnd,
  };
}
