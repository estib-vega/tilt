import { useListChats, deleteChatMutation } from '@/model/api/chat';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import React from 'react';
import { Button } from './ui/button';
import { EllipsisVertical } from 'lucide-react';
import { Popover, PopoverTrigger } from './ui/popover';
import { PopoverContent } from '@radix-ui/react-popover';

export default function Sidebar() {
  return (
    <div className="min-h-0 h-full w-64">
      <ScrollArea>
        <div>
          <h3 className="w-full px-2 text-xs">chats</h3>
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
        <ChatListItem key={chat.id} title={chat.title} id={chat.id} />
      ))}
    </div>
  );
}

interface ChatListItemProps {
  id: string;
  title: string | null;
}

const ChatListItem = React.memo(
  function ChatListItem(props: ChatListItemProps) {
    const { title } = props;

    return (
      <div className="p-2 pl-4 flex justify-between items-center text-sm border-b last:border-0">
        <p>{title ?? 'untitled chat'}</p>
        <EditChatTitleButton chatId={props.id} currentTitle={title} />
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.id === nextProps.id && prevProps.title === nextProps.title,
);

interface EditChatTitleButtonProps {
  chatId: string;
  currentTitle: string | null;
}

function EditChatTitleButton(props: EditChatTitleButtonProps) {
  const { chatId } = props;
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const deleteChat = deleteChatMutation();

  const handleOpenChange = (isOpen: boolean) => {
    setPopoverOpen(isOpen);
  };

  const handleDeleteChat = async () => {
    await deleteChat.mutateAsync(chatId);
    setPopoverOpen(false);
  };

  return (
    <Popover onOpenChange={handleOpenChange} open={popoverOpen}>
      <PopoverTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="cursor-pointer">
          <EllipsisVertical />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col bg-background border rounded-md">
          <div className="p-2 border-b">
            <Button
              onClick={handleDeleteChat}
              disabled={deleteChat.isPending}
              variant="destructive"
              className="cursor-pointer"
            >
              delete chat
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
