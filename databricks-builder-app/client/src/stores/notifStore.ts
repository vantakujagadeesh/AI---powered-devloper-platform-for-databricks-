import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
  actionLabel?: string;
  actionUrl?: string;
}

interface NotifStore {
  notifications: Notification[];
  unreadCount: number;
  panelOpen: boolean;
  add: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  setPanelOpen: (v: boolean) => void;
  togglePanel: () => void;
}

let notifIdCounter = 0;

export const useNotifStore = create<NotifStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  panelOpen: false,
  add: (n) =>
    set((s) => {
      const newN: Notification = {
        ...n,
        id: `notif-${Date.now()}-${notifIdCounter++}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const notifications = [newN, ...s.notifications].slice(0, 50);
      return { notifications, unreadCount: notifications.filter((x) => !x.read).length };
    }),
  markRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
      return { notifications, unreadCount: notifications.filter((x) => !x.read).length };
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  dismiss: (id) =>
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((x) => !x.read).length };
    }),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
}));
