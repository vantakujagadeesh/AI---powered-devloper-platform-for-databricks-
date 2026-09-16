import { create } from 'zustand';

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  dirty: boolean;
}

interface EditorStore {
  tabs: EditorTab[];
  activeTabId: string | null;
  openTab: (tab: Omit<EditorTab, 'dirty'>) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  markClean: (id: string) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  tabs: [],
  activeTabId: null,
  openTab: (tab) =>
    set((s) => {
      const existing = s.tabs.find((t) => t.filePath === tab.filePath);
      if (existing) return { activeTabId: existing.id };
      const newTab = { ...tab, dirty: false };
      return { tabs: [...s.tabs, newTab], activeTabId: newTab.id };
    }),
  closeTab: (id) =>
    set((s) => {
      const tabs = s.tabs.filter((t) => t.id !== id);
      const activeTabId =
        s.activeTabId === id
          ? (tabs[tabs.length - 1]?.id ?? null)
          : s.activeTabId;
      return { tabs, activeTabId };
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  updateContent: (id, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) => t.id === id ? { ...t, content, dirty: true } : t),
    })),
  markClean: (id) =>
    set((s) => ({
      tabs: s.tabs.map((t) => t.id === id ? { ...t, dirty: false } : t),
    })),
}));
