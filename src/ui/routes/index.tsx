import { getDefaultChatId } from '@/model/api/chat';
import { useProjectStore } from '@/store';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const projectId = useProjectStore.getState().projectId;
    const defaultChatId = await getDefaultChatId(projectId);
    throw redirect({
      to: '/chat',
      search: defaultChatId ? { chatId: defaultChatId } : undefined,
    });
  },
});

function App() {
  return (
    <div>
      <div className="min-h-0 h-full w-full flex justify-center items-center">
        <p>loading...</p>
      </div>
    </div>
  );
}
