import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'base' | 'lg';
  sidebarCollapsed: boolean;
  keymap: 'default' | 'vim' | 'emacs';
  setTheme: (t: AppState['theme']) => void;
  setFontSize: (s: AppState['fontSize']) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setKeymap: (k: AppState['keymap']) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 'base',
      sidebarCollapsed: false,
      keymap: 'default',
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setKeymap: (keymap) => set({ keymap }),
    }),
    { name: 'app-settings' }
  )
);
