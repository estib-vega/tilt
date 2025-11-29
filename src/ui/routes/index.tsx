import { createFileRoute } from '@tanstack/react-router';
import Chat from '@/components/Chat';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const chatId = 'default-chat';
  return <Chat chatId={chatId} />;
}
