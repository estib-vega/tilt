import { createFileRoute } from '@tanstack/react-router';
import Chat from '@/components/Chat';
import Sidebar from '@/components/SideBar';
import React from 'react';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const chatId = 'default-chat';
  return (
    <div className="min-h-0 h-full w-full flex">
      <Sidebar />
      <React.Suspense
        fallback={<div className="flex-1 flex items-center justify-center">Loading chat...</div>}
      >
        <Chat chatId={chatId} />
      </React.Suspense>
    </div>
  );
}
