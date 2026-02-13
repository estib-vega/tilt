import { Button } from './ui/button';
import type { JSX } from 'react';
import { useNavigate } from '@tanstack/react-router';

export default function ConfigureModelsButton(): JSX.Element {
  const navigation = useNavigate();
  return (
    <Button
      variant="ghost"
      className="border border-amber-400 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500 cursor-pointer"
      onClick={() =>
        navigation({
          to: '/settings',
        })
      }
    >
      configure...
    </Button>
  );
}
