import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, ExternalLink, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useNotifStore, type Notification } from '@/stores/notifStore';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils';

const TYPE_CONFIG = {
  success: { icon: CheckCircle2, color: 'var(--color-emerald)', bg: 'var(--color-emerald-subtle)' },
  error:   { icon: AlertCircle, color: 'var(--color-rose)', bg: 'var(--color-rose-subtle)' },
  warning: { icon: AlertTriangle, color: 'var(--color-amber)', bg: 'var(--color-amber-subtle)' },
  info:    { icon: Info, color: 'var(--color-sky)', bg: 'var(--color-sky-subtle)' },
};

function NotifItem({ n, onRead, onDismiss }: { n: Notification; onRead: () => void; onDismiss: () => void }) {
  const cfg = TYPE_CONFIG[n.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'group flex gap-3 px-4 py-3 transition-colors cursor-pointer',
        !n.read && 'bg-[var(--color-accent-subtle)]',
        'hover:bg-[var(--color-subtle)]'
      )}
      onClick={onRead}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: cfg.bg }}
      >
        <cfg.icon size={14} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-[13px] font-medium leading-snug', !n.read ? 'text-[var(--color-text-heading)]' : 'text-[var(--color-text-primary)]')}>
            {n.title}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X size={12} />
          </button>
        </div>
        {n.body && <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{n.body}</p>}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {formatRelativeTime(n.createdAt)}
          </span>
          {n.actionLabel && n.actionUrl && (
            <a
              href={n.actionUrl}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-[var(--color-accent)] flex items-center gap-0.5 hover:underline"
            >
              {n.actionLabel} <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
      {!n.read && <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--color-accent)] mt-2" />}
    </motion.div>
  );
}

export default function NotificationCenter() {
  const { notifications, unreadCount, panelOpen, togglePanel, markRead, markAllRead, dismiss } = useNotifStore();
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notif-bell"
        onClick={togglePanel}
        className={cn(
          'relative flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] transition-colors',
          panelOpen
            ? 'bg-[var(--color-subtle)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-subtle)]'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif-dot flex items-center justify-center text-[8px] font-bold text-white" style={{ fontSize: 8, minWidth: 16, height: 16, right: -4, top: -4 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: [0.34, 1.3, 0.64, 1] }}
            className="absolute right-0 top-full mt-2 w-[360px] rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-elevated)] shadow-[var(--shadow-xl)] overflow-hidden z-50"
            style={{ maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[var(--color-text-muted)]" />
                <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">Notifications</span>
                {unreadCount > 0 && (
                  <span className="badge badge-accent">{unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)] hover:underline"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 120px)' }}>
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={28} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-40" />
                  <p className="text-[13px] text-[var(--color-text-muted)]">No notifications yet</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((n) => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      onRead={() => markRead(n.id)}
                      onDismiss={() => dismiss(n.id)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-[var(--color-border)] bg-[var(--color-subtle)] flex justify-center">
                <button
                  onClick={() => { dismiss('all'); }}
                  className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
