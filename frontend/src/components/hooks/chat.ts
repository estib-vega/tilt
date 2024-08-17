import React from "react";
import {
  LLMChatGreeterParams,
  llmChatGreeting,
  llmChatTitle,
  llmGenerate,
} from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChatMessages } from "@server/lib/ai/llm";
import { MessageRole } from "@server/lib/ai/chatStreamGeneration";

const TITLE_GENERATION_THRESHOLD = 2;

function useChatGreeting(params: LLMChatGreeterParams): boolean {
  const { isLoading } = useQuery({
    queryKey: ["chatGreeting"],
    queryFn: () => llmChatGreeting(params),
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Infinity,
  });

  return isLoading;
}

interface ChatHook {
  isLoadingTitle: boolean;
  chatTitle: string | undefined;
  streamingMessage: string | undefined;
  isLoadingAnswer: boolean;
  messages: ChatMessages;
  onEnterInput: (value: string) => void;
  onStreamingMessage: (message: string) => void;
  onStreamingEnd: (fullResponse: string, context: number[]) => void;
}

export function useChat(): ChatHook {
  const [chatTitle, setChatTitle] = React.useState<string | undefined>(
    undefined
  );
  const [messages, setMessages] = React.useState<ChatMessages>([]);
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
        role: MessageRole.Assistant,
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
        chatMessages: prev,
        onMessage: onStreamingMessage,
        onEnd: onStreamingEnd,
      });

      const newMessages: ChatMessages = [
        ...prev,
        {
          role: MessageRole.User,
          content: value,
        },
      ];

      if (
        newMessages.filter((m) => m.role === MessageRole.User).length >=
          TITLE_GENERATION_THRESHOLD &&
        !chatTitle
      ) {
        llmTitleMutation.mutate({
          context: contextRef.current ?? [],
          chatMessages: newMessages,
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
