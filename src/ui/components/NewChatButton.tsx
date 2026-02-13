import { Button } from './ui/button';
import { useLocation, useNavigate } from '@tanstack/react-router';
import React, { type JSX } from 'react';
import { Plus } from 'lucide-react';

interface NewChatButtonProps {
  label?: string;
}

export default function NewChatButton(props: NewChatButtonProps): JSX.Element {
  const { label = 'new chat' } = props;
  const navigate = useNavigate();
  const location = useLocation();

  const handleCreateChat = async () => {
    navigate({ to: '/chat', search: {} });
  };

  const disabled = React.useMemo(() => {
    return location.pathname === '/chat' && location.search.chatId === undefined;
  }, [location.pathname, location.search]);

  return (
    <div className="min-w-0 min-h-0 w-full px-4 flex text-sm">
      <Button
        variant={disabled ? 'outline' : 'default'}
        className="cursor-pointer flex justify-between items-center w-full px-2 py-1 rounded-md"
        onClick={handleCreateChat}
        disabled={disabled}
      >
        <React.Fragment>
          <p>{label}</p>
          <Plus />
        </React.Fragment>
      </Button>
    </div>
  );
}
