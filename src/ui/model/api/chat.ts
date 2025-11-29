import { useChat } from '@ai-sdk/react';
import { useQuery } from '@tanstack/react-query';
import ElectronTransport from './electronTransport';

export function useElectronChat(chatId: string) {
  const { data: messages } = useChatMessages(chatId);
  return useChat({
    transport: new ElectronTransport(),
    messages,
  });
}

function useChatMessages(chatId: string) {
  return useQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async () => window.api.listMessages(chatId),
    initialData: [],
  });
}

export function useListChats() {
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => window.api.listChats(),
    initialData: [],
  });
}
