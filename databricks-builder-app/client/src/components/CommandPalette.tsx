import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Home, BarChart2, Code2, GitBranch,
  Server, ShoppingBag, Settings, Shield, History, Users,
  Folder, MessageSquare, Zap, X, type LucideIcon
} from 'lucide-react';
import Fuse from 'fuse.js';
import { useCommandStore } from '@/stores/commandStore';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useProjects } from '@/contexts/ProjectsContext';
import { cn } from '@/lib/utils';

const NAV_COMMANDS = [
  { id: 'nav:home',        label: 'Go to Home',           group: 'Navigation', icon: Home,       action: (n: (p: string) => void) => n('/') },
  { id: 'nav:dashboard',   label: 'Go to Dashboard',      group: 'Navigation', icon: BarChart2,  action: (n: (p: string) => void) => n('/dashboard') },
  { id: 'nav:ide',         label: 'Open IDE',             group: 'Navigation', icon: Code2,      action: (n: (p: string) => void) => n('/ide') },
  { id: 'nav:analytics',   label: 'View Analytics',       group: 'Navigation', icon: BarChart2,  action: (n: (p: string) => void) => n('/analytics') },
  { id: 'nav:pipeline',    label: 'Pipeline Builder',     group: 'Navigation', icon: GitBranch,  action: (n: (p: string) => void) => n('/pipeline-builder') },
  { id: 'nav:jobs',        label: 'Jobs Dashboard',       group: 'Navigation', icon: Zap,        action: (n: (p: string) => void) => n('/jobs') },
  { id: 'nav:clusters',    label: 'Cluster Manager',      group: 'Navigation', icon: Server,     action: (n: (p: string) => void) => n('/clusters') },
  { id: 'nav:marketplace', label: 'Skill Marketplace',    group: 'Navigation', icon: ShoppingBag,action: (n: (p: string) => void) => n('/marketplace') },
  { id: 'nav:history',     label: 'Execution History',    group: 'Navigation', icon: History,    action: (n: (p: string) => void) => n('/history') },
  { id: 'nav:settings',    label: 'Settings',             group: 'Navigation', icon: Settings,   action: (n: (p: string) => void) => n('/settings') },
  { id: 'nav:admin',       label: 'Admin Panel',          group: 'Navigation', icon: Shield,     action: (n: (p: string) => void) => n('/admin') },
  { id: 'nav:collab',      label: 'Collaboration',        group: 'Navigation', icon: Users,      action: (n: (p: string) => void) => n('/collaboration') },
];

interface FlatCommand {
  id: string;
  label: string;
  description?: string;
  group: string;
  icon: LucideIcon;
  action: () => void;
}

export default function CommandPalette() {
  const navigate = useNavigate();
  const { open, query, setQuery, closePalette, commands } = useCommandStore();
  useCommandPalette(); // registers global Cmd+K
  const { projects } = useProjects();
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build flat command list
  const allCommands = useMemo<FlatCommand[]>(() => {
    const navCmds: FlatCommand[] = NAV_COMMANDS.map((c) => ({
      ...c,
      action: () => { closePalette(); c.action(navigate); },
    }));
    const projectCmds: FlatCommand[] = projects.slice(0, 10).map((p) => ({
      id: `project:${p.id}`,
      label: p.name,
      description: `${p.conversation_count} conversation${p.conversation_count !== 1 ? 's' : ''}`,
      group: 'Projects',
      icon: Folder,
      action: () => { closePalette(); navigate(`/projects/${p.id}`); },
    }));
    const registered: FlatCommand[] = commands.map((c) => ({
      ...c,
      group: c.group ?? 'Actions',
      icon: (c.icon as LucideIcon) ?? Zap,
    }));
    return [...navCmds, ...projectCmds, ...registered];
  }, [projects, commands, closePalette, navigate]);

  // Fuse.js fuzzy search
  const fuse = useMemo(
    () => new Fuse(allCommands, { keys: ['label', 'description', 'group'], threshold: 0.35 }),
    [allCommands]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    return fuse.search(query).map((r) => r.item);
  }, [query, fuse, allCommands]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, FlatCommand[]>();
    for (const cmd of filtered) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return map;
  }, [filtered]);

  const flatFiltered = filtered;

  useEffect(() => { if (open) { setSelected(0); inputRef.current?.focus(); } }, [open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, flatFiltered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); flatFiltered[selected]?.action(); }
    if (e.key === 'Escape') { closePalette(); }
  };

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selected}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  return (
    <AnimatePresence>
      {open && (
        <div className="palette-overlay" onClick={closePalette}>
          <motion.div
            className="palette-box"
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ duration: 0.18, ease: [0.34, 1.3, 0.64, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
              <Search size={16} className="text-[var(--color-text-muted)] flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
                placeholder="Search commands, projects, pages…"
                className="flex-1 bg-transparent border-0 outline-none text-[13.5px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)]"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <X size={14} />
                </button>
              )}
              <kbd className="badge badge-neutral text-[10px]">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-1">
              {flatFiltered.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-[var(--color-text-muted)]">
                  No results for "{query}"
                </div>
              ) : (
                Array.from(grouped.entries()).map(([group, cmds]) => {
                  return (
                    <div key={group}>
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                        {group}
                      </div>
                      {cmds.map((cmd) => {
                        const globalIdx = flatFiltered.indexOf(cmd);
                        const isSelected = globalIdx === selected;
                        return (
                          <button
                            key={cmd.id}
                            data-index={globalIdx}
                            onClick={cmd.action}
                            onMouseEnter={() => setSelected(globalIdx)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                              isSelected
                                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-subtle)]'
                            )}
                          >
                            <cmd.icon
                              size={15}
                              className={cn(
                                'flex-shrink-0',
                                isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
                              )}
                            />
                            <span className="flex-1 text-[13px] font-medium">{cmd.label}</span>
                            {cmd.description && (
                              <span className="text-[11px] text-[var(--color-text-muted)]">{cmd.description}</span>
                            )}
                            {isSelected && <ArrowRight size={13} className="text-[var(--color-accent)]" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-subtle)]">
              <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
                <span><kbd className="badge badge-neutral mr-1">↑↓</kbd> navigate</span>
                <span><kbd className="badge badge-neutral mr-1">↵</kbd> select</span>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">{flatFiltered.length} results</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
