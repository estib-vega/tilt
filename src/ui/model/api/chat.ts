import { useChat } from '@ai-sdk/react';
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import ElectronTransport from './electronTransport';
import type { UpdateChatTitleParams } from '@api/api';

export function useElectronChat(chatId: string) {
  const { data: messages } = useChatMessages(chatId);

  return useChat({
    id: chatId,
    transport: new ElectronTransport(),
    messages,
  });
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

export function useListChats() {
  return useSuspenseQuery(chatsQueryOptions);
}

export async function getDefaultChatId(): Promise<string | null> {
  const chats = await window.api.listChats();
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

export function deleteChatMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => window.api.deleteChat(chatId),
    onSuccess: () => {
      // Invalidate chats query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
}
