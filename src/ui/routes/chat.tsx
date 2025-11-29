import Chat from '@/components/Chat';
import Sidebar from '@/components/SideBar';
import { chatMessagesQueryOptions, chatsQueryOptions } from '@/model/api/chat';
import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { z } from 'zod';

const chatSearchSchema = z.object({
  chatId: z.string().optional(),
});

export const Route = createFileRoute('/chat')({
  loaderDeps: ({ search: { chatId } }) => ({ chatId }),
  loader: ({ context: { queryClient }, deps: { chatId } }) => {
    queryClient.ensureQueryData(chatsQueryOptions);
    if (chatId) {
      queryClient.ensureQueryData(chatMessagesQueryOptions(chatId));
    }
  },
  validateSearch: chatSearchSchema,
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useSearch();
  return (
    <div className="min-h-0 h-full w-full flex">
      <Sidebar selectedChatId={chatId} />
      <React.Suspense
        fallback={<div className="flex-1 flex items-center justify-center">Loading chat...</div>}
      >
        <Chat chatId={chatId ?? 'default-chat'} />
      </React.Suspense>
    </div>
  );
}
