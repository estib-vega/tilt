import React from "react";
import {
  LLMChatGreeterParams,
  llmChatGreeting,
  llmChatTitle,
  llmGenerate,
} from "@/lib/api";
import { ChatMessageInfo } from "@server/lib/llm";
import { useMutation, useQuery } from "@tanstack/react-query";

const TITLE_GENERATION_THRESHOLD = 2;

function useChatGreeting(params: LLMChatGreeterParams): boolean {
  const { isLoading } = useQuery({
    queryKey: ["chatGreeting"],
    queryFn: () => llmChatGreeting(params),
    refetchOnWindowFocus: false,
  });

  return isLoading;
}

interface ChatHook {
  isLoadingTitle: boolean;
  chatTitle: string | undefined;
  streamingMessage: string | undefined;
  isLoadingAnswer: boolean;
  messages: ChatMessageInfo[];
  onEnterInput: (value: string) => void;
  onStreamingMessage: (message: string) => void;
  onStreamingEnd: (fullResponse: string, context: number[]) => void;
}

export function useChat(): ChatHook {
  const [chatTitle, setChatTitle] = React.useState<string | undefined>(
    undefined
  );
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

  const llmGenerateMutation = useMutation({
    mutationFn: llmGenerate,
  });

  const llmTitleMutation = useMutation({
    mutationFn: llmChatTitle,
  });

  const onEnterInput = (value: string) => {
    setMessages((prev) => {
      llmGenerateMutation.mutate({
        prompt: value,
        context: contextRef.current,
        onMessage: onStreamingMessage,
        onEnd: onStreamingEnd,
      });

      const newMessages: ChatMessageInfo[] = [
        ...prev,
        {
          author: "user",
          content: value,
        },
      ];

      if (
        newMessages.filter((m) => m.author === "user").length >=
          TITLE_GENERATION_THRESHOLD &&
        contextRef.current !== undefined
      ) {
        llmTitleMutation.mutate({
          context: contextRef.current,
          onMessage: (message) =>
            setChatTitle((prev) => (prev ? prev + message : message)),
          onEnd: (title) => setChatTitle(title),
        });
      }

      return newMessages;
    });
  };

  return {
    streamingMessage,
    isLoadingAnswer: llmGenerateMutation.isPending || isLoadingGreeting,
    messages,
    onEnterInput,
    onStreamingMessage,
    onStreamingEnd,
    chatTitle,
    isLoadingTitle: llmTitleMutation.isPending,
  };
}
