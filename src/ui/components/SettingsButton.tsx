import { Button } from './ui/button';
import type { JSX } from 'react';
import { Cog, X } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';

export default function SettingsButton(): JSX.Element {
  const location = useLocation();

  if (location.pathname === '/settings') {
    return <CloseSettingsButton />;
  }
  return <OpenSettingsButton />;
}

function CloseSettingsButton(): JSX.Element {
  return (
    <Link to="/">
      <Button size="icon" className="cursor-pointer" title="close settings">
        <X />
      </Button>
    </Link>
  );
}

function OpenSettingsButton(): JSX.Element {
  return (
    <Link to="/settings">
      <Button variant="ghost" size="icon" className="cursor-pointer" title="settings">
        <Cog />
      </Button>
    </Link>
  );
}
