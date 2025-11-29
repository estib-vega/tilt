import { useChat } from '@ai-sdk/react';
import { useSuspenseQuery } from '@tanstack/react-query';
import ElectronTransport from './electronTransport';

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
