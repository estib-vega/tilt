import { useChat } from '@ai-sdk/react';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import ElectronTransport, { type RequestOptions } from './electronTransport';
import type { CustomUIMessage, UpdateChatTitleParams } from '@api/api';
import React from 'react';
import { generateId } from 'ai';
import type { ModelIdentifier } from '@api/ai/model';
import { useModelSelector } from './models';
import { useChatStore } from '@/store';

export function useElectronChat(chatId: string) {
  const queryClient = useQueryClient();
  const { data: messages } = useChatMessages(chatId);

  const chat = useChat<CustomUIMessage>({
    id: chatId,
    transport: new ElectronTransport(),
    messages,
    resume: true,
    onFinish: () => {
      // Invalidate the chats list to reflect the latest order
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      // Maybe we should also invalidate the messages?
      // We don't strictly need it since the stream already has the latest messages.
      // And we don't want to to unnecessary reads from the DB.
    },
  });

  type MessageType = Parameters<typeof chat.sendMessage>[0];

  const sendMessage = async (
    message: MessageType,
    webSearch: boolean,
    modelIdentifier: ModelIdentifier,
  ): Promise<void> => {
    await chat.sendMessage(message, {
      body: {
        webSearch,
        modelIdentifier,
      },
    });
  };

  return {
    ...chat,
    sendMessage,
  };
}

export const chatMessagesQueryOptions = (chatId: string) =>
  queryOptions({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => window.api.listMessages(chatId),
    retry: false,
  });

function useChatMessages(chatId: string) {
  return useSuspenseQuery(chatMessagesQueryOptions(chatId));
}

export const chatsQueryOptions = queryOptions({
  queryKey: ['chats'],
  queryFn: async () => window.api.listChats(),
  retry: false,
});

/**
 * Hook to watch for chat title updates and invalidate the chats query.
 */
function useWatchChatTitleUpdates() {
  const queryClient = useQueryClient();
  React.useEffect(() => {
    const removeListener = window.api.onChatTitleUpdated((_) => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: chatsQueryOptions.queryKey });
      // TODO: Invalidate individual chat titles instead of the whole list.
      // For now it's good enough.
    });

    return () => {
      removeListener();
    };
  }, []);
}

export function useListChats() {
  useWatchChatTitleUpdates();
  return useSuspenseQuery(chatsQueryOptions);
}

export async function getDefaultChatId(filterOut?: string[]): Promise<string | null> {
  const chats = await window.api
    .listChats()
    .then((chats) => (filterOut ? chats.filter((chat) => !filterOut.includes(chat.id)) : chats));
  if (chats.length === 0) return null;
  return chats[0].id;
}

export function useUpdateChatTitleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: UpdateChatTitleParams) => window.api.updateChatTitle(params),
    onSuccess: () => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

interface CreateChatParams {
  messages: Omit<CustomUIMessage, 'id' | 'role'>[];
  useWebSearch: boolean;
  modelIdentifier: ModelIdentifier;
}

export function useCreateChatMutation() {
  const setChatUsesWebSearch = useChatStore((state) => state.setChatUsesWebSearch);
  const setChatUsesModelIdentifier = useChatStore((state) => state.setChatUsesModelIdentifier);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateChatParams) => {
      const { messages, useWebSearch, modelIdentifier } = params;
      const id = generateId();
      const initialMessages: CustomUIMessage[] = messages.map((msg) => ({
        id,
        role: 'user',
        parts: msg.parts,
      }));
      const chatId = await window.api.createChat({ initialMessages });
      setChatUsesWebSearch(chatId, useWebSearch);
      setChatUsesModelIdentifier(chatId, modelIdentifier);
      ElectronTransport.createChatStream(
        {
          chatId,
          trigger: 'submit-message',
          messageId: id,
          messages: initialMessages,
          abortSignal: undefined,
        },
        { webSearch: useWebSearch, modelIdentifier },
      );
      return chatId;
    },
    onSuccess: (newChatId) => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      return newChatId;
    },
  });
}

export function useDeleteChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => window.api.deleteChat(chatId),
    onSuccess: (_, chatId) => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
    },
  });
}

export function useChatUsage(chatId: string) {
  const usageMap = useChatStore((state) => state.chatUsage);
  const setUsage = useChatStore((state) => state.setChatUsage);
  const usage = React.useMemo(() => {
    return usageMap[chatId];
  }, [usageMap, chatId]);

  React.useEffect(() => {
    const removeListener = window.api.onChatUsage((data) => {
      if (data.id === chatId) {
        setUsage(chatId, data.usage);
      }
    });

    return () => {
      removeListener();
    };
  }, [chatId]);

  return usage;
}

interface ChatParamsHook {
  useWebSearch: boolean;
  setUseWebSearch: React.Dispatch<React.SetStateAction<boolean>>;
  modelSelectorHook: ReturnType<typeof useModelSelector>;
}

export function useChatParams(chatId: string | undefined): ChatParamsHook {
  const defaultedChatId = chatId ?? 'new-chat';
  const chatUsesWebSearch = useChatStore((state) => state.chatUsesWebSearch);
  const chatUsesModelIdentifier = useChatStore((state) => state.chatUsesModelIdentifier);
  const setChatUsesWebSearch = useChatStore((state) => state.setChatUsesWebSearch);

  const params: RequestOptions = React.useMemo(() => {
    const webSearch = chatUsesWebSearch[defaultedChatId] ?? false;
    const modelIdentifier = chatUsesModelIdentifier[defaultedChatId] ?? undefined;
    return {
      webSearch,
      modelIdentifier,
    };
  }, [defaultedChatId, chatUsesWebSearch, chatUsesModelIdentifier]);

  const modelSelectorHook = useModelSelector(defaultedChatId);

  const setUseWebSearch = React.useCallback<React.Dispatch<React.SetStateAction<boolean>>>(
    (value) => {
      const nextValue = typeof value === 'function' ? value(params.webSearch) : value;
      setChatUsesWebSearch(defaultedChatId, nextValue);
    },
    [chatId, setChatUsesWebSearch, params.webSearch, defaultedChatId],
  );

  return {
    useWebSearch: params.webSearch ?? false,
    setUseWebSearch,
    modelSelectorHook,
  };
}
