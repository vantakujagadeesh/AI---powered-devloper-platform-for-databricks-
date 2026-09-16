import { create } from 'zustand';

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  group?: string;
  action: () => void;
}

interface CommandStore {
  open: boolean;
  query: string;
  commands: Command[];
  openPalette: () => void;
  closePalette: () => void;
  setQuery: (q: string) => void;
  register: (cmd: Command) => void;
  unregister: (id: string) => void;
}

import React from 'react';

export const useCommandStore = create<CommandStore>((set) => ({
  open: false,
  query: '',
  commands: [],
  openPalette: () => set({ open: true, query: '' }),
  closePalette: () => set({ open: false, query: '' }),
  setQuery: (query) => set({ query }),
  register: (cmd) =>
    set((s) => ({ commands: [...s.commands.filter((c) => c.id !== cmd.id), cmd] })),
  unregister: (id) =>
    set((s) => ({ commands: s.commands.filter((c) => c.id !== id) })),
}));
