import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserPlus, MessageSquare, Bell, Activity,
  CheckCircle2, Circle, Eye, Send, X, Paperclip,
  AtSign, Hash, ChevronRight, MoreHorizontal, Smile
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProjects } from '@/contexts/ProjectsContext';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'offline';
  avatar: string;
  activeProject?: string;
}

interface Comment {
  id: string;
  author: TeamMember;
  content: string;
  timestamp: Date;
  reactions: Record<string, string[]>;
  mentions: string[];
}

interface Channel {
  id: string;
  name: string;
  description: string;
  unread: number;
}

// ── Mock data ──────────────────────────────────────────────
const MEMBERS: TeamMember[] = [
  { id: 'u1', name: 'Alice Chen', email: 'alice@company.com', role: 'admin', status: 'online', avatar: 'AC', activeProject: 'ETL Pipeline' },
  { id: 'u2', name: 'Bob Kumar', email: 'bob@company.com', role: 'editor', status: 'online', avatar: 'BK', activeProject: 'ML Platform' },
  { id: 'u3', name: 'Carol Smith', email: 'carol@company.com', role: 'editor', status: 'away', avatar: 'CS' },
  { id: 'u4', name: 'Dave Okonkwo', email: 'dave@company.com', role: 'viewer', status: 'offline', avatar: 'DO' },
];

const CHANNELS: Channel[] = [
  { id: 'general', name: 'general', description: 'Team-wide announcements', unread: 0 },
  { id: 'data-eng', name: 'data-engineering', description: 'ETL, pipelines, and Delta Lake', unread: 3 },
  { id: 'ml', name: 'ml-platform', description: 'MLflow, models, and serving', unread: 1 },
  { id: 'reviews', name: 'code-reviews', description: 'Agent output reviews', unread: 0 },
];

const MOCK_COMMENTS: Record<string, Comment[]> = {
  general: [
    { id: 'c1', author: MEMBERS[0], content: 'Team standup moved to 9:30 AM tomorrow.', timestamp: new Date(Date.now() - 3600000 * 2), reactions: { '👍': ['u2', 'u3'], '✅': ['u4'] }, mentions: [] },
    { id: 'c2', author: MEMBERS[1], content: '@carol the MLflow experiment is ready for review. Can you check the feature drift?', timestamp: new Date(Date.now() - 3600000), reactions: { '👀': ['u3'] }, mentions: ['carol'] },
    { id: 'c3', author: MEMBERS[2], content: 'On it! Will check the `customer_features` table drift metrics.', timestamp: new Date(Date.now() - 1800000), reactions: {}, mentions: [] },
  ],
  'data-eng': [
    { id: 'd1', author: MEMBERS[0], content: 'The orders DLT pipeline is now running in continuous mode. Latency is ~45s.', timestamp: new Date(Date.now() - 7200000), reactions: { '🚀': ['u2', 'u3', 'u4'] }, mentions: [] },
    { id: 'd2', author: MEMBERS[1], content: 'Should we add a data quality expectation for null `amount` values?', timestamp: new Date(Date.now() - 3600000), reactions: {}, mentions: [] },
    { id: 'd3', author: MEMBERS[0], content: '@bob Yes, I added `.expect_or_drop("amount IS NOT NULL")`. Deployed.', timestamp: new Date(Date.now() - 1200000), reactions: { '👍': ['u2'] }, mentions: ['bob'] },
  ],
};

const STATUS_DOT: Record<TeamMember['status'], string> = {
  online: 'done',
  away: 'pending',
  offline: 'idle',
};

const ROLE_BADGE: Record<TeamMember['role'], string> = {
  admin: 'badge-error',
  editor: 'badge-purple',
  viewer: 'badge-neutral',
};

const EMOJI_CHOICES = ['👍', '👏', '🚀', '✅', '💡', '❤️', '🎯', '🔥'];

// ── Member presence dot ────────────────────────────────────
function MemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--color-subtle)] rounded-[var(--radius-md)] transition-colors">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
          style={{ background: member.status === 'online' ? 'var(--color-accent)' : 'var(--color-subtle)' }}
        >
          <span className={member.status !== 'online' ? 'text-[var(--color-text-muted)]' : ''}>{member.avatar}</span>
        </div>
        <span className={cn('status-dot absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[var(--color-sidebar-bg)]', STATUS_DOT[member.status])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-medium text-[var(--color-text-primary)] truncate">{member.name}</p>
        {member.activeProject ? (
          <p className="text-[10.5px] text-[var(--color-emerald)] truncate">● Working on {member.activeProject}</p>
        ) : (
          <p className="text-[10.5px] text-[var(--color-text-muted)] capitalize">{member.status}</p>
        )}
      </div>
      <span className={cn('badge text-[9px] flex-shrink-0', ROLE_BADGE[member.role])}>{member.role}</span>
    </div>
  );
}

// ── Comment bubble ─────────────────────────────────────────
function CommentBubble({
  comment, onReact,
}: {
  comment: Comment;
  onReact: (commentId: string, emoji: string) => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 group"
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style={{ background: 'var(--color-accent)' }}
      >
        {comment.author.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[12.5px] font-semibold text-[var(--color-text-heading)]">{comment.author.name}</span>
          <span className="text-[10.5px] text-[var(--color-text-muted)]">
            {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[13px] text-[var(--color-text-primary)] leading-relaxed">
          {comment.content.split(/(@\w+)/g).map((part, i) =>
            part.startsWith('@') ? (
              <span key={i} className="text-[var(--color-accent)] font-medium cursor-pointer">{part}</span>
            ) : part.includes('`') ? (
              <span key={i} dangerouslySetInnerHTML={{
                __html: part.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 text-[0.85em] font-mono">$1</code>')
              }} />
            ) : <span key={i}>{part}</span>
          )}
        </p>

        {/* Reactions */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {Object.entries(comment.reactions).map(([emoji, users]) => (
            <button
              key={emoji}
              onClick={() => onReact(comment.id, emoji)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-subtle)] hover:bg-[var(--color-accent-subtle)] transition-colors text-[11px]"
            >
              <span>{emoji}</span>
              <span className="text-[var(--color-text-muted)]">{users.length}</span>
            </button>
          ))}
          {/* Add reaction */}
          <div className="relative">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              className="opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost btn-sm text-[var(--color-text-muted)]"
            >
              <Smile size={12} />
            </button>
            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-7 left-0 flex gap-1 p-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-elevated)] shadow-[var(--shadow-lg)] z-10"
                >
                  {EMOJI_CHOICES.map((e) => (
                    <button key={e} onClick={() => { onReact(comment.id, e); setShowEmoji(false); }}
                      className="text-[16px] hover:scale-125 transition-transform"
                    >{e}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function CollaborationPage() {
  const [activeChannel, setActiveChannel] = useState('general');
  const [channels, setChannels] = useState(CHANNELS);
  const [allComments, setAllComments] = useState<Record<string, Comment[]>>(MOCK_COMMENTS);
  const [draft, setDraft] = useState('');
  const { projects } = useProjects();

  const comments = allComments[activeChannel] ?? [];

  const sendComment = () => {
    if (!draft.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: MEMBERS[0], // current user (alice)
      content: draft.trim(),
      timestamp: new Date(),
      reactions: {},
      mentions: [],
    };
    setAllComments((prev) => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] ?? []), newComment],
    }));
    setDraft('');
    // Mark as read
    setChannels((prev) => prev.map((c) => c.id === activeChannel ? { ...c, unread: 0 } : c));
  };

  const addReaction = (commentId: string, emoji: string) => {
    setAllComments((prev) => ({
      ...prev,
      [activeChannel]: prev[activeChannel].map((c) => {
        if (c.id !== commentId) return c;
        const users = c.reactions[emoji] ?? [];
        const userId = 'u1';
        return {
          ...c,
          reactions: {
            ...c.reactions,
            [emoji]: users.includes(userId) ? users.filter((u) => u !== userId) : [...users, userId],
          },
        };
      }),
    }));
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar: channels + team */}
        <div className="w-56 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-sidebar-bg)]">
          {/* Channels */}
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Channels</p>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { setActiveChannel(ch.id); setChannels((p) => p.map((c) => c.id === ch.id ? { ...c, unread: 0 } : c)); }}
                className={cn('sidebar-link w-full mb-0.5', activeChannel === ch.id && 'active')}
              >
                <Hash size={13} className="icon" />
                <span className="flex-1">{ch.name}</span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[var(--color-accent)] text-white text-[9px] flex items-center justify-center font-bold">{ch.unread}</span>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] px-3 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Team</p>
              <button className="btn btn-ghost btn-sm"><UserPlus size={11} /></button>
            </div>
            {MEMBERS.map((m) => <MemberCard key={m.id} member={m} />)}
          </div>

          {/* Projects shared */}
          <div className="border-t border-[var(--color-border)] px-3 pt-3 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Shared Projects</p>
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="sidebar-link w-full mb-0.5 cursor-default">
                <div className="w-4 h-4 rounded bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-bold" style={{ color: 'var(--color-accent)' }}>{p.name.charAt(0)}</span>
                </div>
                <span className="flex-1 truncate text-[11.5px]">{p.name}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{(p as any).conversation_count ?? 0}</span>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-[11px] text-[var(--color-text-muted)]">No projects yet</p>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Channel header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] flex-shrink-0 bg-[var(--color-elevated)]">
            <Hash size={15} style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="text-[14px] font-semibold text-[var(--color-text-heading)]">
                {channels.find((c) => c.id === activeChannel)?.name}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {channels.find((c) => c.id === activeChannel)?.description}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center">
                {MEMBERS.filter((m) => m.status === 'online').map((m) => (
                  <div key={m.id} className="w-6 h-6 rounded-full -ml-1.5 first:ml-0 border-2 border-[var(--color-elevated)] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ background: 'var(--color-accent)' }} title={m.name}
                  >{m.avatar}</div>
                ))}
              </div>
              <span className="text-[11.5px] text-[var(--color-text-muted)] ml-1">
                {MEMBERS.filter((m) => m.status === 'online').length} online
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {comments.map((c) => (
              <CommentBubble key={c.id} comment={c} onReact={addReaction} />
            ))}
            {comments.length === 0 && (
              <div className="py-20 text-center">
                <MessageSquare size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--color-accent)' }} />
                <p className="text-[13px] text-[var(--color-text-muted)]">No messages yet — start the conversation!</p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-5 py-3 border-t border-[var(--color-border)]">
            <div className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-subtle)] px-3 py-2 focus-within:border-[var(--color-border-focus)] transition-colors">
              <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex-shrink-0 mb-0.5"><Paperclip size={14} /></button>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                rows={1}
                placeholder={`Message #${channels.find((c) => c.id === activeChannel)?.name}…`}
                className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] leading-relaxed"
                style={{ minHeight: 24, maxHeight: 100 }}
              />
              <button
                onClick={sendComment}
                disabled={!draft.trim()}
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all',
                  draft.trim() ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]' : 'bg-[var(--color-subtle)] cursor-not-allowed'
                )}
              >
                <Send size={12} className={draft.trim() ? 'text-white' : 'text-[var(--color-text-muted)]'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
