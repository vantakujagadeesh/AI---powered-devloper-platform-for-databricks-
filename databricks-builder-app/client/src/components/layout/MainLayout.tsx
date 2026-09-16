import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import TopBar from './TopBar';

interface MainLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-canvas)]">
      {showSidebar && <Sidebar />}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
