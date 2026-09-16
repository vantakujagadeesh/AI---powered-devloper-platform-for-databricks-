import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Loader2, ChevronDown, ChevronUp,
  Sparkles, Terminal, FileText, Database, Code2, Wrench,
  Copy, Check, AlertCircle, CheckCircle2, Maximize2, Minimize2,
  Trash2, Download, RefreshCw
} from 'lucide-react';
import { useProjects } from '@/contexts/ProjectsContext';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────
interface ToolCall {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  output?: string;
  error?: boolean;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  thinking?: string;
  timestamp: Date;
  error?: boolean;
}

// ── Tool icon mapper ───────────────────────────────────────
const TOOL_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Bash: Terminal,
  Read: FileText,
  Write: FileText,
  Edit: FileText,
  Glob: FileText,
  Grep: FileText,
  ExecuteSQL: Database,
  CreateTable: Database,
  default: Wrench,
};

function getToolIcon(tool: string) {
  return TOOL_ICONS[tool] ?? TOOL_ICONS.default;
}

// ── Tool card ──────────────────────────────────────────────
function ToolCard({ tc }: { tc: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = getToolIcon(tc.tool);

  const copy = () => {
    navigator.clipboard.writeText(tc.output ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      layout
      className={cn(
        'rounded-[var(--radius-md)] border text-[11.5px] overflow-hidden',
        tc.error
          ? 'border-[color-mix(in_srgb,var(--color-rose)_25%,transparent)] bg-[var(--color-rose-subtle)]'
          : 'border-[var(--color-border)] bg-[var(--color-subtle)]'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{
            background: tc.error ? 'var(--color-rose-subtle)' : 'var(--color-ai-purple-subtle)',
          }}
        >
          <Icon size={11} style={{ color: tc.error ? 'var(--color-rose)' : 'var(--color-ai-purple)' }} />
        </div>
        <span className="font-medium text-[var(--color-text-primary)]">{tc.tool}</span>
        {tc.error ? (
          <AlertCircle size={11} style={{ color: 'var(--color-rose)' }} className="ml-auto flex-shrink-0" />
        ) : tc.output ? (
          <CheckCircle2 size={11} style={{ color: 'var(--color-emerald)' }} className="ml-auto flex-shrink-0" />
        ) : (
          <Loader2 size={11} className="ml-auto flex-shrink-0 animate-spin-slow" style={{ color: 'var(--color-text-muted)' }} />
        )}
        {expanded ? <ChevronUp size={11} className="text-[var(--color-text-muted)]" /> : <ChevronDown size={11} className="text-[var(--color-text-muted)]" />}
      </button>
      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border)] bg-[var(--color-code-bg)] p-3">
              {tc.input && Object.keys(tc.input).length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Input</p>
                  <pre className="text-[11px] text-[var(--color-code-text)] whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(tc.input, null, 2)}
                  </pre>
                </div>
              )}
              {tc.output && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Output</p>
                    <button onClick={copy} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                      {copied ? <Check size={10} /> : <Copy size={10} />}
                    </button>
                  </div>
                  <pre className="text-[11px] text-[var(--color-code-text)] whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto">
                    {tc.output}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Message bubble ─────────────────────────────────────────
function MsgBubble({ msg }: { msg: ChatMsg }) {
  const isUser = msg.role === 'user';
  const [showThinking, setShowThinking] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2.5', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold',
          isUser
            ? 'bg-[var(--color-accent)] text-white'
            : 'bg-[var(--color-ai-purple-subtle)] text-[var(--color-ai-purple)]'
        )}
      >
        {isUser ? 'U' : <Sparkles size={10} />}
      </div>

      <div className={cn('flex-1 min-w-0', isUser && 'items-end flex flex-col')}>
        {/* Thinking */}
        {msg.thinking && (
          <button
            onClick={() => setShowThinking((v) => !v)}
            className="text-[10.5px] text-[var(--color-text-muted)] flex items-center gap-1 mb-1 hover:text-[var(--color-text-secondary)]"
          >
            <Sparkles size={9} /> Thinking...
            {showThinking ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
        )}
        <AnimatePresence>
          {showThinking && msg.thinking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-ai-purple-subtle)] text-[11px] text-[var(--color-text-muted)] italic max-h-28 overflow-y-auto"
            >
              {msg.thinking}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tool calls */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2 w-full">
            {msg.toolCalls.map((tc) => <ToolCard key={tc.id} tc={tc} />)}
          </div>
        )}

        {/* Text content */}
        {msg.content && (
          <div
            className={cn(
              'rounded-[var(--radius-lg)] px-3 py-2.5 prose-chat max-w-full',
              isUser
                ? 'bg-[var(--color-accent)] text-white rounded-tr-[var(--radius-xs)]'
                : msg.error
                ? 'bg-[var(--color-rose-subtle)] border border-[color-mix(in_srgb,var(--color-rose)_25%,transparent)] text-[var(--color-rose)] rounded-tl-[var(--radius-xs)]'
                : 'bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-tl-[var(--radius-xs)]'
            )}
          >
            <div
              className="whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{
                __html: isUser
                  ? msg.content
                  : msg.content.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-black/10 text-[0.85em]">$1</code>'),
              }}
            />
          </div>
        )}

        <p className="text-[10px] text-[var(--color-text-muted)] mt-1 px-1">
          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

// ── Typing indicator ───────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--color-ai-purple-subtle)] flex-shrink-0">
        <Sparkles size={10} style={{ color: 'var(--color-ai-purple)' }} />
      </div>
      <div className="flex items-center gap-1 px-3 py-3 rounded-[var(--radius-lg)] bg-[var(--color-elevated)] border border-[var(--color-border)]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main AI Overlay ────────────────────────────────────────
let msgIdCounter = 0;
const newId = () => `msg-${Date.now()}-${msgIdCounter++}`;

export default function AIAssistantOverlay() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: newId(),
      role: 'assistant',
      content: "Hi! I'm your Databricks AI assistant. Ask me anything — I can query your data, write pipelines, fix SQL, and more.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [projectId, setProjectId] = useState<string>('');
  const { projects } = useProjects();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ⌘J global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Auto-resize textarea
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || streaming) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Add user message
    const userMsg: ChatMsg = { id: newId(), role: 'user', content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    if (!projectId) {
      // No project selected — respond helpfully
      setMessages((prev) => [
        ...prev,
        {
          id: newId(),
          role: 'assistant',
          content: 'Please select a project above so I can run agent tasks in the correct workspace.',
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const assistantId = newId();
    const assistantMsg: ChatMsg = { id: assistantId, role: 'assistant', content: '', toolCalls: [], timestamp: new Date() };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      // 1) Invoke agent
      const invokeRes = await fetch('/api/invoke_agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ project_id: projectId, message: msg }),
        signal: ctrl.signal,
      });

      if (!invokeRes.ok) throw new Error(`Agent invoke failed: ${invokeRes.status}`);
      const { execution_id } = await invokeRes.json();

      // 2) SSE stream
      const streamRes = await fetch(`/api/stream_progress/${execution_id}`, {
        method: 'POST',
        credentials: 'include',
        signal: ctrl.signal,
      });

      if (!streamRes.ok) throw new Error('Stream failed');
      const reader = streamRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const event = JSON.parse(line.slice(5).trim());
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const updated = { ...m };

                if (event.type === 'text' || event.type === 'assistant_text') {
                  updated.content += event.content ?? event.text ?? '';
                } else if (event.type === 'thinking') {
                  updated.thinking = (updated.thinking ?? '') + (event.content ?? '');
                } else if (event.type === 'tool_use') {
                  const tc: ToolCall = {
                    id: event.id ?? newId(),
                    tool: event.tool ?? event.name ?? 'Tool',
                    input: event.input ?? {},
                  };
                  updated.toolCalls = [...(updated.toolCalls ?? []), tc];
                } else if (event.type === 'tool_result') {
                  updated.toolCalls = (updated.toolCalls ?? []).map((tc) =>
                    tc.id === event.tool_use_id
                      ? { ...tc, output: String(event.content ?? ''), error: event.is_error }
                      : tc
                  );
                }
                return updated;
              })
            );
          } catch {
            // non-JSON line
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${(err as Error).message}`, error: true }
              : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, projectId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const exportChat = () => {
    const md = messages
      .map((m) => `**${m.role === 'user' ? 'You' : 'AI'}** (${m.timestamp.toLocaleTimeString()})\n\n${m.content}`)
      .join('\n\n---\n\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-export.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            id="ai-overlay-trigger"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full shadow-[var(--shadow-xl)] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-ai-purple))' }}
            aria-label="Open AI Assistant (⌘J)"
            title="AI Assistant ⌘J"
          >
            <Sparkles size={20} className="text-white" />
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-[var(--color-emerald)] border-2 border-[var(--color-canvas)]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="ai-panel"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.34, 1.3, 0.64, 1] }}
            className={cn(
              'fixed z-40 flex flex-col',
              'bg-[var(--color-elevated)] border border-[var(--color-border-strong)]',
              'rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]',
              maximized
                ? 'inset-4'
                : 'bottom-5 right-5 w-[380px] h-[580px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-ai-purple))' }}
              >
                <Sparkles size={13} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--color-text-heading)] leading-none">AI Assistant</p>
                <p className="text-[10px] text-[var(--color-emerald)] mt-0.5">● Online</p>
              </div>
              {/* Project selector */}
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="text-[11px] px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-text-secondary)] max-w-[120px] truncate"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button onClick={exportChat} className="btn btn-ghost btn-sm" title="Export chat"><Download size={12} /></button>
                <button onClick={() => setMessages((m) => m.slice(0, 1))} className="btn btn-ghost btn-sm" title="Clear"><Trash2 size={12} /></button>
                <button onClick={() => setMaximized((v) => !v)} className="btn btn-ghost btn-sm">
                  {maximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                </button>
                <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm"><X size={13} /></button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {messages.map((m) => <MsgBubble key={m.id} msg={m} />)}
              {streaming && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3 border-t border-[var(--color-border)]">
              <div className="flex items-end gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-subtle)] px-3 py-2 focus-within:border-[var(--color-border-focus)] transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-placeholder)] leading-relaxed"
                  style={{ minHeight: 24, maxHeight: 120 }}
                />
                {streaming ? (
                  <button
                    onClick={() => { abortRef.current?.abort(); setStreaming(false); }}
                    className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-rose)] flex items-center justify-center"
                    title="Stop generation"
                  >
                    <X size={11} className="text-white" />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className={cn(
                      'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all',
                      input.trim()
                        ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] shadow-sm'
                        : 'bg-[var(--color-subtle)] cursor-not-allowed'
                    )}
                  >
                    <Send size={12} className={input.trim() ? 'text-white' : 'text-[var(--color-text-muted)]'} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1.5 px-1">⌘J to toggle · Claude 3.5 Sonnet</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
