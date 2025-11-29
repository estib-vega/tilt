import { useListChats } from '@/model/api/chat';
import type { UIChat } from '@api/api';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import React from 'react';

export default function Sidebar() {
  return (
    <div className="min-h-0 h-full w-64">
      <ScrollArea>
        <div>
          <h3 className="w-full px-2 text-xs">CHATS</h3>
          <React.Suspense
            fallback={<div className="p-2 text-sm text-muted-foreground">Loading chats...</div>}
          >
            <ChatList />
          </React.Suspense>
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatList() {
  const { data: chats, status, error } = useListChats();
  if (status === 'error') console.error('Error loading chats:', error);
  if (chats.length === 0) {
    return <div className="p-2 text-sm text-muted-foreground">No chats yet.</div>;
  }

  return (
    <div>
      {chats.map((chat) => (
        <ChatListItem key={chat.id} chatItem={chat} />
      ))}
    </div>
  );
}

interface ChatListItemProps {
  chatItem: UIChat;
}

function ChatListItem(props: ChatListItemProps) {
  const { chatItem } = props;
  return <div className="p-2 border-b last:border-0">{chatItem.title ?? 'Untitled Chat'}</div>;
}
