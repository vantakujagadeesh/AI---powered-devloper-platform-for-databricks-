import { useEffect, useRef } from 'react';
import { useCommandStore } from '@/stores/commandStore';

export function useCommandPalette() {
  const { openPalette, closePalette, open, register, unregister } = useCommandStore();

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) closePalette();
        else openPalette();
      }
      if (e.key === 'Escape' && open) {
        closePalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, openPalette, closePalette]);

  return { openPalette, closePalette, register, unregister, isOpen: open };
}
