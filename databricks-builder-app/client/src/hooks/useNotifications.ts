import { useEffect, useCallback } from 'react';
import { useNotifStore } from '@/stores/notifStore';

const POLL_INTERVAL_MS = 30_000; // 30s polling fallback

export function useNotifications() {
  const { add } = useNotifStore();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.notifications)) {
        for (const n of data.notifications) {
          add({
            type: n.type ?? 'info',
            title: n.title,
            body: n.body,
            actionLabel: n.action_label,
            actionUrl: n.action_url,
          });
        }
      }
    } catch {
      // Silent — notifications are non-critical
    }
  }, [add]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { fetchNotifications };
}
