import { Link, useLocation } from '@tanstack/react-router';
import SettingsButton from './SettingsButton';
import { cn } from '@/lib/utils';

export default function Header() {
  const location = useLocation();
  const isNotesRoute = location.pathname === '/notes';
  const isChatRoute = location.pathname === '/chat';

  return (
    <>
      <header className="[-webkit-app-region:no-drag] p-2 flex items-center gap-4 px-6 pointer-events-auto">
        <Link
          to="/chat"
          className={cn(
            'text-sm font-medium hover:text-primary transition-colors',
            isChatRoute && 'underline',
          )}
          activeProps={{ className: 'text-primary' }}
        >
          chat
        </Link>
        <Link
          to="/notes"
          className={cn(
            'text-sm font-medium hover:text-primary transition-colors',
            isNotesRoute && 'underline',
          )}
          activeProps={{ className: 'text-primary' }}
        >
          notes
        </Link>

        <SettingsButton />
      </header>
    </>
  );
}
