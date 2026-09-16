import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Play, Square, RefreshCw, Plus, Trash2, Cpu, MemoryStick, DollarSign, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

interface Cluster {
  id: string;
  name: string;
  state: 'RUNNING' | 'TERMINATED' | 'PENDING' | 'RESIZING';
  nodeType: string;
  workers: number;
  sparkVersion: string;
  costPerHour: number;
  uptime: string;
  cpuPct: number;
  memPct: number;
  creator: string;
}

const MOCK_CLUSTERS: Cluster[] = [
  { id: 'c1', name: 'etl-cluster-prod', state: 'RUNNING', nodeType: 'i3.xlarge', workers: 4, sparkVersion: '14.3.x-scala2.12', costPerHour: 3.20, uptime: '6h 14m', cpuPct: 68, memPct: 52, creator: 'alice@company.com' },
  { id: 'c2', name: 'ml-gpu-cluster', state: 'RUNNING', nodeType: 'p3.2xlarge', workers: 2, sparkVersion: '14.3.x-gpu-scala2.12', costPerHour: 12.60, uptime: '1h 02m', cpuPct: 91, memPct: 78, creator: 'bob@company.com' },
  { id: 'c3', name: 'dev-cluster', state: 'TERMINATED', nodeType: 'm5.large', workers: 1, sparkVersion: '14.3.x-scala2.12', costPerHour: 0.80, uptime: '—', cpuPct: 0, memPct: 0, creator: 'carol@company.com' },
  { id: 'c4', name: 'stream-processor', state: 'RUNNING', nodeType: 'c5.2xlarge', workers: 6, sparkVersion: '14.3.x-scala2.12', costPerHour: 7.80, uptime: '22h 45m', cpuPct: 45, memPct: 61, creator: 'alice@company.com' },
  { id: 'c5', name: 'batch-cluster-staging', state: 'PENDING', nodeType: 'm5.xlarge', workers: 3, sparkVersion: '14.3.x-scala2.12', costPerHour: 2.10, uptime: '—', cpuPct: 0, memPct: 0, creator: 'dave@company.com' },
];

const STATE_CONFIG = {
  RUNNING:    { label: 'Running',    badge: 'badge-success', dot: 'running' },
  TERMINATED: { label: 'Terminated', badge: 'badge-neutral', dot: 'idle' },
  PENDING:    { label: 'Pending',    badge: 'badge-warning', dot: 'pending' },
  RESIZING:   { label: 'Resizing',   badge: 'badge-info',    dot: 'running' },
};

// Mini sparkline data
const genSparkline = (peak: number) =>
  Array.from({ length: 20 }, (_, i) => ({
    t: i,
    v: Math.min(100, Math.max(0, peak + (Math.random() - 0.5) * 20)),
  }));

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATE_CONFIG[cluster.state];
  const cpuData = genSparkline(cluster.cpuPct);
  const memData = genSparkline(cluster.memPct);

  return (
    <motion.div
      layout
      className="card overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-ai-purple-subtle)] flex items-center justify-center flex-shrink-0">
          <Server size={16} style={{ color: 'var(--color-ai-purple)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--color-text-heading)] truncate">{cluster.name}</span>
            <span className={cn('badge', cfg.badge, 'flex-shrink-0')}>
              <span className={cn('status-dot mr-1', cfg.dot)} style={{ width: 5, height: 5 }} />
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{cluster.nodeType} · {cluster.workers} worker{cluster.workers !== 1 ? 's' : ''} · Spark {cluster.sparkVersion.split('-')[0]}</p>
        </div>

        {/* CPU/Mem mini bars */}
        {cluster.state === 'RUNNING' && (
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <div style={{ width: 80, height: 32 }}>
                <ResponsiveContainer>
                  <AreaChart data={cpuData}>
                    <Area type="monotone" dataKey="v" stroke="var(--color-accent)" strokeWidth={1.5} fill="var(--color-accent-subtle)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">CPU {cluster.cpuPct}%</p>
            </div>
            <div className="text-center">
              <div style={{ width: 80, height: 32 }}>
                <ResponsiveContainer>
                  <AreaChart data={memData}>
                    <Area type="monotone" dataKey="v" stroke="var(--color-ai-purple)" strokeWidth={1.5} fill="var(--color-ai-purple-subtle)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">Mem {cluster.memPct}%</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">${cluster.costPerHour.toFixed(2)}<span className="text-[10px] font-normal text-[var(--color-text-muted)]">/hr</span></p>
            {cluster.uptime !== '—' && <p className="text-[10.5px] text-[var(--color-text-muted)]">↑ {cluster.uptime}</p>}
          </div>
          {cluster.state === 'RUNNING' ? (
            <button className="btn btn-danger btn-sm gap-1"><Square size={11} /> Stop</button>
          ) : cluster.state === 'TERMINATED' ? (
            <button className="btn btn-primary btn-sm gap-1"><Play size={11} /> Start</button>
          ) : (
            <button className="btn btn-secondary btn-sm" disabled><RefreshCw size={11} className="animate-spin-slow" /></button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="btn btn-ghost btn-sm"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[var(--color-border)] overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[var(--color-subtle)]">
              {[
                { label: 'Creator', value: cluster.creator.split('@')[0] },
                { label: 'Spark Version', value: cluster.sparkVersion },
                { label: 'Workers', value: `${cluster.workers} nodes` },
                { label: 'Est. Cost', value: `$${(cluster.costPerHour * 6).toFixed(2)}/day` },
              ].map((d) => (
                <div key={d.label}>
                  <p className="text-[10.5px] text-[var(--color-text-muted)] mb-0.5">{d.label}</p>
                  <p className="text-[12px] font-medium text-[var(--color-text-primary)]">{d.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState(MOCK_CLUSTERS);

  const totalCost = clusters.filter((c) => c.state === 'RUNNING').reduce((a, c) => a + c.costPerHour, 0);

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Cluster Manager</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Monitor, start, stop, and resize Databricks clusters</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="card px-3 py-2 flex items-center gap-2">
              <DollarSign size={13} style={{ color: 'var(--color-emerald)' }} />
              <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">${totalCost.toFixed(2)}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">/ hr running</span>
            </div>
            <button className="btn btn-primary gap-1.5"><Plus size={13} /> New Cluster</button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Clusters', value: clusters.length, icon: Server, color: 'var(--color-ai-purple)' },
            { label: 'Running', value: clusters.filter((c) => c.state === 'RUNNING').length, icon: Play, color: 'var(--color-emerald)' },
            { label: 'Total Workers', value: clusters.filter((c) => c.state === 'RUNNING').reduce((a, c) => a + c.workers, 0), icon: Cpu, color: 'var(--color-sky)' },
          ].map((kpi, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center" style={{ background: `${kpi.color}22` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-[11px] text-[var(--color-text-muted)]">{kpi.label}</p>
                <p className="text-xl font-bold text-[var(--color-text-heading)]">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cluster cards */}
        <div className="flex flex-col gap-3">
          {clusters.map((c) => <ClusterCard key={c.id} cluster={c} />)}
        </div>
      </div>
    </MainLayout>
  );
}
