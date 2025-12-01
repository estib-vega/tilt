import Chat from '@/components/Chat';
import Sidebar from '@/components/SideBar';
import { chatsQueryOptions } from '@/model/api/chat';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const chatSearchSchema = z.object({
  chatId: z.string().optional(),
});

export const Route = createFileRoute('/chat')({
  loaderDeps: ({ search: { chatId } }) => ({ chatId }),
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(chatsQueryOptions);
  },
  validateSearch: chatSearchSchema,
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useSearch();
  return (
    <div className="min-h-0 h-full w-full flex">
      <Sidebar selectedChatId={chatId} />
      <Chat chatId={chatId} />
    </div>
  );
}
