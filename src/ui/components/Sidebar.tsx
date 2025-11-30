import { useListChats, deleteChatMutation } from '@/model/api/chat';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import React, { type JSX } from 'react';
import { Button } from './ui/button';
import { EllipsisVertical, Plus } from 'lucide-react';
import { Popover, PopoverTrigger } from './ui/popover';
import { PopoverContent } from '@radix-ui/react-popover';
import { Link } from '@tanstack/react-router';

interface SideBarProps {
  selectedChatId: string | undefined;
}

export default function Sidebar(props: SideBarProps): JSX.Element {
  return (
    <div className="min-h-0 h-full w-64">
      <ScrollArea>
        <div>
          <h3 className="w-full px-4 text-xs">chats</h3>
          <React.Suspense
            fallback={<div className="p-2 text-sm text-muted-foreground">Loading chats...</div>}
          >
            <ChatList selectedChatId={props.selectedChatId} />
          </React.Suspense>
        </div>
      </ScrollArea>
    </div>
  );
}

interface ChatListProps {
  selectedChatId: string | undefined;
}

function ChatList(props: ChatListProps): JSX.Element {
  const { data: chats, status, error } = useListChats();
  if (status === 'error') console.error('Error loading chats:', error);
  if (chats.length === 0) {
    return <div className="p-2 text-sm text-muted-foreground">No chats yet.</div>;
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <NewChatButton />
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          title={chat.title}
          id={chat.id}
          selected={chat.id === props.selectedChatId}
        />
      ))}
    </div>
  );
}

interface ChatListItemProps {
  id: string;
  title: string | null;
  selected: boolean;
}

const ChatListItem = React.memo(
  function ChatListItem(props: ChatListItemProps) {
    const { title } = props;

    const itemClassNames = [
      'cursor-pointer',
      'flex justify-between items-center w-full pl-2 rounded-md',
      props.selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
    ].join(' ');

    return (
      <Link to="/chat" search={{ chatId: props.id }} className="block w-full">
        <div className="px-4 flex text-sm">
          <div className={itemClassNames}>
            <p>{title ?? 'untitled chat'}</p>
            <EditChatTitleButton chatId={props.id} currentTitle={title} />
          </div>
        </div>
      </Link>
    );
  },
  (prevProps, nextProps) =>
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.selected === nextProps.selected,
);

interface EditChatTitleButtonProps {
  chatId: string;
  currentTitle: string | null;
}

function NewChatButton() {
  return (
    <Link to="/chat" search={{}}>
      <div className="px-4 flex text-sm">
        <div className="cursor-pointer flex justify-between items-center w-full px-2 py-1 rounded-md border box-border hover:bg-primary hover:text-primary-foreground transition-colors">
          <p>new chat</p>
          <Plus />
        </div>
      </div>
    </Link>
  );
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
