import {
  useListChats,
  deleteChatMutation,
  createChatMutation,
  getDefaultChatId,
} from '@/model/api/chat';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import React, { type JSX } from 'react';
import { Button } from './ui/button';
import { EllipsisVertical, Plus } from 'lucide-react';
import { Popover, PopoverTrigger } from './ui/popover';
import { PopoverContent } from '@radix-ui/react-popover';
import { Link, useNavigate } from '@tanstack/react-router';
import { Shimmer } from './ai-elements/shimmer';
import { Flipper, Flipped } from 'react-flip-toolkit';

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

  const chatsKey = React.useMemo(() => chats.map((chat) => chat.id).join(','), [chats]);

  return (
    <div className="flex flex-col gap-2 py-2">
      <NewChatButton />
      <Flipper flipKey={chatsKey}>
        {chats.map((chat) => (
          <Flipped key={chat.id} flipId={chat.id}>
            {(flippedProps) => (
              <ChatListItem
                flippedProps={flippedProps}
                title={chat.title}
                id={chat.id}
                selected={chat.id === props.selectedChatId}
              />
            )}
          </Flipped>
        ))}
      </Flipper>
    </div>
  );
}

interface ChatListItemProps {
  id: string;
  title: string | null;
  selected: boolean;
  flippedProps: object;
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
      <div {...props.flippedProps}>
        <Link to="/chat" search={{ chatId: props.id }} className="block w-full">
          <div className="px-4 flex text-sm">
            <div className={itemClassNames}>
              <p>{title ?? 'untitled chat'}</p>
              <EditChatTitleButton chatId={props.id} currentTitle={title} />
            </div>
          </div>
        </Link>
      </div>
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
  const createChat = createChatMutation();
  const navigate = useNavigate();

  const handleCreateChat = async () => {
    const chatId = await createChat.mutateAsync();
    navigate({ to: '/chat', search: { chatId } });
  };

  return (
    <div className="px-4 flex text-sm">
      <Button
        variant="default"
        className="cursor-pointer flex justify-between items-center w-full px-2 py-1 rounded-md"
        onClick={handleCreateChat}
        disabled={createChat.isPending}
      >
        {createChat.isPending ? (
          <Shimmer>creating...</Shimmer>
        ) : (
          <React.Fragment>
            <p>new chat</p>
            <Plus />
          </React.Fragment>
        )}
      </Button>
    </div>
  );
}

function EditChatTitleButton(props: EditChatTitleButtonProps) {
  const { chatId } = props;
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const navigate = useNavigate();
  const deleteChat = deleteChatMutation();

  const handleOpenChange = (isOpen: boolean) => {
    setPopoverOpen(isOpen);
  };

  const handleDeleteChat = async () => {
    await deleteChat.mutateAsync(chatId);
    const nextChat = await getDefaultChatId([chatId]);
    setPopoverOpen(false);
    navigate({ to: '/chat', search: nextChat ? { chatId: nextChat } : {} });
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
