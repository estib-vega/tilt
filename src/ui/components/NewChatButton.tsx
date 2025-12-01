import { createChatMutation } from '@/model/api/chat';
import { useNavigate } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Shimmer } from './ai-elements/shimmer';
import React, { type JSX } from 'react';
import { Plus } from 'lucide-react';

interface NewChatButtonProps {
  label?: string;
}

export default function NewChatButton(props: NewChatButtonProps): JSX.Element {
  const { label = 'new chat' } = props;
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
            <p>{label}</p>
            <Plus />
          </React.Fragment>
        )}
      </Button>
    </div>
  );
}
