import Chat from '@/components/Chat';
import SideBar from '@/components/SideBar';
import { chatsQueryOptions } from '@/model/api/chat';
import { useProjectStore } from '@/store';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const chatSearchSchema = z.object({
  chatId: z.string().optional(),
});

export const Route = createFileRoute('/chat')({
  loaderDeps: ({ search: { chatId } }) => ({ chatId }),
  loader: ({ context: { queryClient } }) => {
    const projectId = useProjectStore.getState().projectId;
    queryClient.ensureQueryData(chatsQueryOptions(projectId));
  },
  validateSearch: chatSearchSchema,
  component: ChatPage,
});

function ChatPage() {
  const { chatId } = Route.useSearch();
  return (
    <div className="min-h-0 min-w-0 h-full w-full flex">
      <SideBar selectedChatId={chatId} />
      <Chat chatId={chatId} />
    </div>
  );
}
