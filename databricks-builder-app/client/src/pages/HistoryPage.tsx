import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Search, Filter, Play, Download, RefreshCw,
  CheckCircle2, XCircle, AlertCircle, Clock, ChevronDown,
  ChevronRight, Folder, MessageSquare, Zap, Calendar
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

interface HistoryRecord {
  id: string;
  project: string;
  conversation: string;
  message: string;
  status: 'completed' | 'error' | 'cancelled';
  duration: string;
  tokens: number;
  tools: string[];
  timestamp: string;
  events: { type: string; label: string; ts: number }[];
}

const MOCK_HISTORY: HistoryRecord[] = [
  { id: 'ex1', project: 'ETL Pipeline', conversation: 'Build daily sync job', message: 'Create a Delta Live Table pipeline for the orders table with SCD type 2', status: 'completed', duration: '4m 12s', tokens: 8420, tools: ['Bash', 'Write', 'Read', 'Glob'], timestamp: '2h ago', events: [{ type: 'thinking', label: 'Analyzing schema', ts: 0 }, { type: 'tool_use', label: 'Read orders schema', ts: 1 }, { type: 'tool_use', label: 'Write pipeline.py', ts: 2 }, { type: 'result', label: 'DLT pipeline created', ts: 3 }] },
  { id: 'ex2', project: 'ML Platform', conversation: 'Model training setup', message: 'Set up MLflow experiment for LightGBM classifier training', status: 'completed', duration: '2m 35s', tokens: 5100, tools: ['Bash', 'Write'], timestamp: '4h ago', events: [{ type: 'thinking', label: 'Planning MLflow setup', ts: 0 }, { type: 'tool_use', label: 'Create experiment', ts: 1 }] },
  { id: 'ex3', project: 'Analytics', conversation: 'Dashboard queries', message: 'Optimize the daily revenue aggregation query', status: 'error', duration: '1m 8s', tokens: 2300, tools: ['Bash', 'Read'], timestamp: '6h ago', events: [{ type: 'thinking', label: 'Parsing query', ts: 0 }, { type: 'error', label: 'SQL syntax error in MERGE', ts: 1 }] },
  { id: 'ex4', project: 'Data Quality', conversation: 'Validation checks', message: 'Add row count and null value checks to the bronze layer', status: 'completed', duration: '3m 47s', tokens: 7200, tools: ['Write', 'Read', 'Bash', 'Grep'], timestamp: '1d ago', events: [{ type: 'thinking', label: 'Analyzing tables', ts: 0 }, { type: 'tool_use', label: 'Write validation.py', ts: 1 }, { type: 'result', label: 'Checks added', ts: 2 }] },
  { id: 'ex5', project: 'ETL Pipeline', conversation: 'Schema migration', message: 'Migrate the users table to add email_verified column', status: 'cancelled', duration: '0m 45s', tokens: 950, tools: ['Bash'], timestamp: '2d ago', events: [{ type: 'thinking', label: 'Reading schema', ts: 0 }, { type: 'cancelled', label: 'User cancelled', ts: 1 }] },
];

const STATUS_CONFIG = {
  completed:  { icon: CheckCircle2, color: 'var(--color-emerald)', badge: 'badge-success', label: 'Completed' },
  error:      { icon: XCircle,      color: 'var(--color-rose)',    badge: 'badge-error',   label: 'Error' },
  cancelled:  { icon: AlertCircle,  color: 'var(--color-amber)',   badge: 'badge-warning', label: 'Cancelled' },
};

function ExecutionReplay({ record }: { record: HistoryRecord }) {
  const [step, setStep] = useState(-1);

  return (
    <div className="mt-3 border-t border-[var(--color-border)] pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Execution Replay</p>
      <div className="flex flex-col gap-1.5">
        {record.events.map((ev, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-[12px] transition-all cursor-pointer',
              i <= step ? 'bg-[var(--color-accent-subtle)]' : 'bg-[var(--color-subtle)]',
            )}
            onClick={() => setStep(i <= step ? i - 1 : i)}
          >
            <div className={cn(
              'status-dot flex-shrink-0',
              ev.type === 'error' || ev.type === 'cancelled' ? 'error' :
              ev.type === 'result' ? 'done' :
              i <= step ? 'done' : 'idle'
            )} />
            <span className="text-[var(--color-text-muted)] w-20 flex-shrink-0 text-[10.5px] capitalize">{ev.type.replace('_', ' ')}</span>
            <span className="text-[var(--color-text-primary)]">{ev.label}</span>
          </motion.div>
        ))}
      </div>
      <button
        onClick={() => setStep(-1)}
        className="btn btn-ghost btn-sm gap-1 mt-2"
      >
        <RefreshCw size={11} /> Reset
      </button>
    </div>
  );
}

function HistoryRow({ record }: { record: HistoryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[record.status];

  return (
    <motion.div
      layout
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-[var(--color-subtle)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <cfg.icon size={16} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{record.message}</span>
            <span className={cn('badge flex-shrink-0', cfg.badge)}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><Folder size={10} /> {record.project}</span>
            <span className="flex items-center gap-1"><MessageSquare size={10} /> {record.conversation}</span>
            <span className="flex items-center gap-1"><Clock size={10} /> {record.duration}</span>
            <span className="flex items-center gap-1"><Zap size={10} /> {record.tokens.toLocaleString()} tokens</span>
            <span className="flex items-center gap-1"><Calendar size={10} /> {record.timestamp}</span>
          </div>
          <div className="flex gap-1 mt-2">
            {record.tools.map((tool) => (
              <span key={tool} className="badge badge-neutral text-[10px]">{tool}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="btn btn-secondary btn-sm gap-1"
          >
            <Play size={11} /> Re-run
          </button>
          {expanded ? <ChevronDown size={14} className="text-[var(--color-text-muted)]" /> : <ChevronRight size={14} className="text-[var(--color-text-muted)]" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4"
          >
            <ExecutionReplay record={record} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type StatusFilter = 'all' | HistoryRecord['status'];

export default function HistoryPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filtered = MOCK_HISTORY.filter(
    (r) =>
      (status === 'all' || r.status === status) &&
      (r.message.toLowerCase().includes(search.toLowerCase()) ||
        r.project.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <MainLayout>
      <div className="p-6 max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Execution History</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Full history of agent runs with replay capability</p>
          </div>
          <button className="btn btn-secondary btn-sm gap-1">
            <Download size={12} /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search executions…" className="input pl-8" />
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'completed', 'error', 'cancelled'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn('btn btn-sm capitalize', status === s ? 'btn-primary' : 'btn-secondary')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* History list */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((record) => (
              <HistoryRow key={record.id} record={record} />
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <History size={32} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-30" />
              <p className="text-[13px] text-[var(--color-text-muted)]">No executions found</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
