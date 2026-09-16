import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, Square, RefreshCw, Search, ExternalLink, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, BarChart2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  name: string;
  status: 'success' | 'running' | 'failed' | 'paused' | 'pending';
  schedule: string;
  lastRun: string;
  duration: string;
  cluster: string;
  tasks: number;
}

const MOCK_JOBS: Job[] = [
  { id: 'j1', name: 'Daily ETL Pipeline', status: 'success', schedule: '0 2 * * *', lastRun: '2h ago', duration: '4m 32s', cluster: 'etl-cluster', tasks: 5 },
  { id: 'j2', name: 'Feature Engineering', status: 'running', schedule: '0 */6 * * *', lastRun: '23m ago', duration: '~12m', cluster: 'ml-cluster', tasks: 8 },
  { id: 'j3', name: 'Model Training Job', status: 'failed', schedule: 'Manual', lastRun: '1d ago', duration: '1h 2m', cluster: 'gpu-cluster', tasks: 3 },
  { id: 'j4', name: 'Unity Catalog Sync', status: 'success', schedule: '*/30 * * * *', lastRun: '8m ago', duration: '45s', cluster: 'serverless', tasks: 2 },
  { id: 'j5', name: 'Report Generation', status: 'paused', schedule: '0 9 * * 1', lastRun: '6d ago', duration: '2m 10s', cluster: 'jobs-cluster', tasks: 4 },
  { id: 'j6', name: 'Streaming Ingest', status: 'running', schedule: 'Continuous', lastRun: 'Now', duration: 'Streaming', cluster: 'stream-cluster', tasks: 1 },
];

const STATUS_CONFIG = {
  success: { label: 'Success', color: 'var(--color-emerald)', icon: CheckCircle2, badge: 'badge-success' },
  running: { label: 'Running', color: 'var(--color-sky)', icon: RefreshCw, badge: 'badge-info' },
  failed:  { label: 'Failed',  color: 'var(--color-rose)', icon: XCircle, badge: 'badge-error' },
  paused:  { label: 'Paused', color: 'var(--color-amber)', icon: AlertCircle, badge: 'badge-warning' },
  pending: { label: 'Pending', color: 'var(--color-text-muted)', icon: Clock, badge: 'badge-neutral' },
};

// Simple Gantt timeline
function GanttBar({ job, index }: { job: Job; index: number }) {
  const widths: Record<Job['status'], string> = { success: '70%', running: '55%', failed: '40%', paused: '25%', pending: '10%' };
  const colors: Record<Job['status'], string> = { success: 'var(--color-emerald)', running: 'var(--color-sky)', failed: 'var(--color-rose)', paused: 'var(--color-amber)', pending: 'var(--color-text-muted)' };
  return (
    <motion.div
      className="flex items-center gap-3 py-1.5"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <span className="text-[11px] text-[var(--color-text-muted)] w-36 truncate flex-shrink-0">{job.name}</span>
      <div className="flex-1 bg-[var(--color-subtle)] rounded-full h-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full opacity-80"
          style={{ background: colors[job.status] }}
          initial={{ width: 0 }}
          animate={{ width: widths[job.status] }}
          transition={{ duration: 0.7, delay: index * 0.05, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10.5px] text-[var(--color-text-muted)] w-16 text-right flex-shrink-0">{job.duration}</span>
    </motion.div>
  );
}

export default function JobsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Job['status'] | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const filtered = MOCK_JOBS.filter((j) =>
    (filter === 'all' || j.status === filter) &&
    j.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_JOBS.length,
    running: MOCK_JOBS.filter((j) => j.status === 'running').length,
    failed: MOCK_JOBS.filter((j) => j.status === 'failed').length,
    success: MOCK_JOBS.filter((j) => j.status === 'success').length,
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Jobs</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Databricks job scheduler & monitor</p>
          </div>
          <button className="btn btn-primary gap-1.5">
            <Play size={13} /> Run Job
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Jobs', value: stats.total, color: 'var(--color-text-heading)' },
            { label: 'Running', value: stats.running, color: 'var(--color-sky)' },
            { label: 'Successful', value: stats.success, color: 'var(--color-emerald)' },
            { label: 'Failed', value: stats.failed, color: 'var(--color-rose)' },
          ].map((kpi, i) => (
            <div key={i} className="card p-4">
              <p className="text-[11px] text-[var(--color-text-muted)] mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Gantt Timeline */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-[var(--color-text-muted)]" />
            <p className="text-[13px] font-semibold text-[var(--color-text-heading)]">Run Timeline</p>
          </div>
          <div>
            {MOCK_JOBS.map((job, i) => <GanttBar key={job.id} job={job} index={i} />)}
          </div>
        </div>

        {/* Filter + search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="input pl-8"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'running', 'success', 'failed', 'paused'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn('btn btn-sm capitalize', filter === f ? 'btn-primary' : 'btn-secondary')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-subtle)]">
                {['Job Name', 'Status', 'Schedule', 'Last Run', 'Duration', 'Tasks', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((job, i) => {
                  const cfg = STATUS_CONFIG[job.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.tr
                      key={job.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-subtle)] cursor-pointer transition-colors"
                      onClick={() => setSelectedJob(job === selectedJob ? null : job)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Zap size={13} className="text-[var(--color-text-muted)]" />
                          <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{job.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('badge', cfg.badge, 'gap-1')}>
                          <StatusIcon size={10} className={job.status === 'running' ? 'animate-spin-slow' : ''} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)] font-mono">{job.schedule}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)]">{job.lastRun}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)]">{job.duration}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)]">{job.tasks} tasks</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {job.status === 'running' ? (
                            <button className="btn btn-danger btn-sm gap-1"><Square size={10} /> Stop</button>
                          ) : (
                            <button className="btn btn-secondary btn-sm gap-1"><Play size={10} /> Run</button>
                          )}
                          <button className="btn btn-ghost btn-sm"><ExternalLink size={11} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
