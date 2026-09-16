import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { useUser } from '@/contexts/UserContext';
import { useCommandStore } from '@/stores/commandStore';
import NotificationCenter from '@/components/NotificationCenter';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Projects',
  '/dashboard': 'Dashboard',
  '/ide': 'IDE',
  '/analytics': 'Analytics',
  '/pipeline-builder': 'Pipeline Builder',
  '/evaluation': 'Evaluation',
  '/jobs': 'Jobs',
  '/clusters': 'Clusters',
  '/marketplace': 'Marketplace',
  '/history': 'History',
  '/settings': 'Settings',
  '/admin': 'Admin',
  '/collaboration': 'Collaboration',
  '/doc': 'Documentation',
};

export default function TopBar() {
  const location = useLocation();
  const { user } = useUser();
  const { openPalette } = useCommandStore();

  const displayName = user?.split('@')[0] || '';
  const initials = displayName.charAt(0).toUpperCase();

  // Resolve page title
  let title = 'Databricks AI Dev Kit';
  for (const [path, label] of Object.entries(PAGE_TITLES)) {
    if (location.pathname === path || (path !== '/' && location.pathname.startsWith(path))) {
      title = label;
      break;
    }
  }
  if (location.pathname.startsWith('/projects/')) title = 'Project';

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 border-b border-[var(--color-border)] bg-[var(--color-panel)]/90 backdrop-blur-md z-20"
      style={{ height: 'var(--header-height)' }}
    >
      {/* Left: breadcrumb / title */}
      <div className="flex items-center gap-3">
        <h1 className="text-[14px] font-semibold text-[var(--color-text-heading)] leading-none">
          {title}
        </h1>
      </div>

      {/* Right: search bar, notifs, theme, avatar */}
      <div className="flex items-center gap-2">
        {/* Quick search / palette trigger */}
        <button
          id="topbar-search"
          onClick={openPalette}
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)]',
            'border border-[var(--color-border)] bg-[var(--color-elevated)]',
            'text-[12px] text-[var(--color-text-muted)]',
            'hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]',
            'transition-all w-44'
          )}
          aria-label="Open command palette"
        >
          <Search size={13} />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="badge badge-neutral text-[9px] px-1 py-0.5">⌘K</kbd>
        </button>

        {/* Mobile search icon */}
        <button
          onClick={openPalette}
          className="sm:hidden flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-subtle)] transition-colors"
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        <NotificationCenter />
        <ThemeSwitcher />

        {/* Avatar */}
        {displayName && (
          <div
            className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 cursor-pointer select-none"
            title={user || undefined}
            aria-label={`User: ${displayName}`}
          >
            {initials}
          </div>
        )}
      </div>
    </header>
  );
}
