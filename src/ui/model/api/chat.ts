import { useChat } from '@ai-sdk/react';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import ElectronTransport from './electronTransport';
import type { CustomUIMessage, UpdateChatTitleParams } from '@api/api';
import React from 'react';

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

  const sendMessage = async (message: MessageType, webSearch: boolean): Promise<void> => {
    await chat.sendMessage(message, {
      body: {
        webSearch,
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

export function updateChatTitleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: UpdateChatTitleParams) => window.api.updateChatTitle(params),
    onSuccess: () => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}

export function createChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => window.api.createChat(),
    onSuccess: (newChatId) => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      return newChatId;
    },
  });
}

export function deleteChatMutation() {
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
