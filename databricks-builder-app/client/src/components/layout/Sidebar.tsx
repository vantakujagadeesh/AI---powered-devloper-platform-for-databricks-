import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BarChart2, Code2, GitBranch, FlaskConical,
  Zap, Server, ShoppingBag, History, Settings,
  Shield, Users, ChevronLeft, ChevronRight, Sparkles,
  MessageSquare, Folder, Database, type LucideIcon
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useProjects } from '@/contexts/ProjectsContext';
import { cn } from '@/lib/utils';

interface NavSection {
  title?: string;
  items: NavItem[];
}
interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
  badgeVariant?: 'accent' | 'purple' | 'success' | 'warning';
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/',          icon: Home,       label: 'Projects' },
      { to: '/dashboard', icon: BarChart2,  label: 'Dashboard' },
    ],
  },
  {
    title: 'Developer',
    items: [
      { to: '/ide',            icon: Code2,       label: 'IDE',              badgeVariant: 'purple', badge: 'BETA' },
      { to: '/pipeline-builder',icon: GitBranch,  label: 'Pipeline Builder', badgeVariant: 'purple', badge: 'BETA' },
      { to: '/evaluation',     icon: FlaskConical, label: 'Evaluation' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/jobs',      icon: Zap,        label: 'Jobs' },
      { to: '/clusters',  icon: Server,     label: 'Clusters' },
      { to: '/analytics', icon: BarChart2,  label: 'Analytics' },
      { to: '/history',   icon: History,    label: 'History' },
      { to: '/catalog',   icon: Database,   label: 'Data Catalog' },
    ],
  },
  {
    title: 'Platform',
    items: [
      { to: '/marketplace',   icon: ShoppingBag, label: 'Marketplace' },
      { to: '/collaboration', icon: Users,        label: 'Collaboration' },
      { to: '/admin',         icon: Shield,       label: 'Admin' },
      { to: '/settings',      icon: Settings,     label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { projects } = useProjects();
  const location = useLocation();

  const w = sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex-shrink-0 flex flex-col h-full border-r border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden relative"
      style={{ minWidth: sidebarCollapsed ? 64 : 260 }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border)]" style={{ height: 'var(--header-height)' }}>
        <div className="flex-shrink-0 w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <p className="text-[13px] font-bold text-[var(--color-text-heading)] leading-none">AI Dev Kit</p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Databricks Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-subtle)] transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-2">
            <AnimatePresence>
              {!sidebarCollapsed && section.title && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            {section.items.map((item) => (
              <SidebarLink key={item.to} item={item} collapsed={sidebarCollapsed} />
            ))}
          </div>
        ))}

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div className="mb-2">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]"
                >
                  Recent Projects
                </motion.p>
              )}
            </AnimatePresence>
            {projects.slice(0, 5).map((p) => (
              <NavLink
                key={p.id}
                to={`/projects/${p.id}`}
                className={({ isActive }) => cn(
                  'sidebar-link',
                  isActive && 'active',
                  sidebarCollapsed && 'justify-center px-0'
                )}
              >
                <Folder className="icon flex-shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 truncate text-[13px]"
                    >
                      {p.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom shortcut hint */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2.5 border-t border-[var(--color-border)]"
          >
            <p className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1.5">
              <kbd className="badge badge-neutral">⌘K</kbd> Command palette
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function SidebarLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => cn(
        'sidebar-link relative',
        isActive && 'active',
        collapsed && 'justify-center px-0 w-10 mx-auto'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={16} className="icon flex-shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 truncate text-[13px]"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {!collapsed && item.badge && (
        <span className={cn('badge', `badge-${item.badgeVariant ?? 'accent'}`, 'text-[9px] px-1.5 py-0.5')}>
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}
