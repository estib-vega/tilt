import { useChat } from '@ai-sdk/react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
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

function useChatMessages(chatId: string) {
  return useSuspenseQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => window.api.listMessages(chatId),
  });
}

export function useListChats() {
  return useSuspenseQuery({
    queryKey: ['chats'],
    queryFn: async () => window.api.listChats(),
    retry: false,
  });
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
