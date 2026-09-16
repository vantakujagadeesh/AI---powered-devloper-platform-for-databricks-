import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2, Zap, CheckCircle2, AlertCircle, Clock, Cpu,
  TrendingUp, TrendingDown, RefreshCw, ArrowRight, Activity,
  DollarSign, Layers
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useProjects } from '@/contexts/ProjectsContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

// ── Animated counter ──────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {prefix}{typeof value === 'number' ? value.toFixed(decimals) : '–'}{suffix}
    </motion.span>
  );
}

// ── KPI Card ──────────────────────────────────────────────
function KpiCard({
  label, value, prefix = '', suffix = '', decimals = 0,
  icon: Icon, trend, trendLabel, color = 'accent', loading
}: {
  label: string; value: number | null; prefix?: string; suffix?: string; decimals?: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  trend?: number; trendLabel?: string; color?: string; loading?: boolean;
}) {
  const positive = (trend ?? 0) >= 0;
  const colorVars: Record<string, { bg: string; icon: string }> = {
    accent:  { bg: 'var(--color-accent-subtle)',   icon: 'var(--color-accent)' },
    purple:  { bg: 'var(--color-ai-purple-subtle)', icon: 'var(--color-ai-purple)' },
    emerald: { bg: 'var(--color-emerald-subtle)',   icon: 'var(--color-emerald)' },
    amber:   { bg: 'var(--color-amber-subtle)',     icon: 'var(--color-amber)' },
    sky:     { bg: 'var(--color-sky-subtle)',       icon: 'var(--color-sky)' },
  };
  const c = colorVars[color] ?? colorVars.accent;

  return (
    <motion.div
      className="card p-5 flex flex-col gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
          style={{ background: c.bg }}
        >
          <Icon size={16} style={{ color: c.icon }} />
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-[11px] font-medium', positive ? 'text-[var(--color-emerald)]' : 'text-[var(--color-rose)]')}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        {loading ? (
          <div className="skeleton h-8 w-24 mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[var(--color-text-heading)] leading-none">
            <AnimatedNumber value={value ?? 0} prefix={prefix} suffix={suffix} decimals={decimals} />
          </p>
        )}
        <p className="text-[12px] text-[var(--color-text-muted)] mt-1.5">{label}</p>
        {trendLabel && <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{trendLabel}</p>}
      </div>
    </motion.div>
  );
}

// ── Activity Event Item ───────────────────────────────────
function ActivityItem({ event, index }: { event: { type: string; label: string; time: string; status: string }; index: number }) {
  const statusColors: Record<string, string> = {
    success: 'var(--color-emerald)',
    error: 'var(--color-rose)',
    running: 'var(--color-amber)',
    info: 'var(--color-sky)',
  };
  return (
    <motion.div
      className="flex items-center gap-3 py-2.5 border-b border-[var(--color-border)] last:border-0"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        className="status-dot flex-shrink-0"
        style={{ background: statusColors[event.status] ?? 'var(--color-text-muted)' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] text-[var(--color-text-primary)] truncate">{event.label}</p>
        <p className="text-[10.5px] text-[var(--color-text-muted)]">{event.type}</p>
      </div>
      <span className="text-[10.5px] text-[var(--color-text-muted)] flex-shrink-0">{event.time}</span>
    </motion.div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-[var(--radius-md)] px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--color-text-heading)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] text-[var(--color-text-secondary)]">
          {p.name}: <span className="font-semibold text-[var(--color-text-primary)]">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── MOCK activity (replaces real WS feed until backend ready) ─
const MOCK_ACTIVITY = [
  { type: 'agent.done', label: 'Pipeline job completed successfully', time: '2m ago', status: 'success' },
  { type: 'agent.error', label: 'SQL query execution failed', time: '5m ago', status: 'error' },
  { type: 'agent.running', label: 'Analyzing Unity Catalog schema', time: '8m ago', status: 'running' },
  { type: 'system.info', label: 'New skill installed: databricks-lakebase', time: '22m ago', status: 'info' },
  { type: 'agent.done', label: 'Model evaluation run finished', time: '41m ago', status: 'success' },
  { type: 'agent.done', label: 'Delta table created in dev catalog', time: '1h ago', status: 'success' },
];

const MOCK_TIMESERIES = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  executions: Math.floor(Math.random() * 40 + 5),
  tokens: Math.floor(Math.random() * 8000 + 1000),
  errors: Math.floor(Math.random() * 5),
}));

export default function DashboardPage() {
  const navigate = useNavigate();
  const { summary, timeseries, loading, refresh } = useAnalytics();
  const { projects } = useProjects();
  const [refreshing, setRefreshing] = useState(false);

  // Use real data if available, otherwise show mocks
  const ts = timeseries.length > 0 ? timeseries : MOCK_TIMESERIES;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Mission Control</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Real-time platform overview</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-secondary gap-2"
          >
            <RefreshCw size={13} className={cn(refreshing && 'animate-spin-slow')} />
            Refresh
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger-children">
          <KpiCard label="Total Executions" value={summary?.total_executions ?? 248} icon={Activity} trend={12} trendLabel="vs last 30 days" color="accent" loading={loading} />
          <KpiCard label="Success Rate" value={summary?.success_rate ?? 94.2} suffix="%" decimals={1} icon={CheckCircle2} trend={2} trendLabel="improving" color="emerald" loading={loading} />
          <KpiCard label="Tokens Used Today" value={summary?.tokens_today ?? 42300} icon={Cpu} trend={-8} trendLabel="vs yesterday" color="purple" loading={loading} />
          <KpiCard label="Est. Cost Today" value={summary?.estimated_cost_usd ?? 1.24} prefix="$" decimals={2} icon={DollarSign} trendLabel="based on token usage" color="sky" loading={loading} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Area chart: executions over time */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-text-heading)]">Executions over time</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Last 30 days</p>
              </div>
              <span className="badge badge-accent">30d</span>
            </div>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ts} margin={{ top: 4, right: 4, bottom: 4, left: -24 }}>
                  <defs>
                    <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-rose)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-rose)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="executions" name="Executions" stroke="var(--color-accent)" strokeWidth={2} fill="url(#execGrad)" />
                  <Area type="monotone" dataKey="errors" name="Errors" stroke="var(--color-rose)" strokeWidth={1.5} fill="url(#errGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart: top projects */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-semibold text-[var(--color-text-heading)]">Top projects</p>
              <button onClick={() => navigate('/')} className="text-[11px] text-[var(--color-accent)] hover:underline flex items-center gap-0.5">
                All <ArrowRight size={11} />
              </button>
            </div>
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Layers size={24} className="text-[var(--color-text-muted)] opacity-40 mb-2" />
                <p className="text-[12px] text-[var(--color-text-muted)]">No projects yet</p>
              </div>
            ) : (
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projects.slice(0, 6).map((p) => ({ name: p.name.slice(0, 10), count: p.conversation_count }))}
                    layout="vertical"
                    margin={{ top: 0, right: 8, bottom: 0, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} width={72} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Conversations" fill="var(--color-ai-purple)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: activity feed + quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Live activity */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="status-dot running" />
                <p className="text-[13px] font-semibold text-[var(--color-text-heading)]">Live Activity</p>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)]">Last 24h</span>
            </div>
            <div>
              {MOCK_ACTIVITY.map((ev, i) => (
                <ActivityItem key={i} event={ev} index={i} />
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <p className="text-[13px] font-semibold text-[var(--color-text-heading)] mb-4">Quick Actions</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Open IDE',           icon: BarChart2, to: '/ide',             color: 'var(--color-ai-purple)' },
                { label: 'View Analytics',     icon: BarChart2, to: '/analytics',       color: 'var(--color-sky)' },
                { label: 'Pipeline Builder',   icon: Zap,       to: '/pipeline-builder', color: 'var(--color-emerald)' },
                { label: 'Browse Marketplace', icon: Layers,    to: '/marketplace',     color: 'var(--color-amber)' },
              ].map((a) => (
                <button
                  key={a.to}
                  onClick={() => navigate(a.to)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-subtle)] transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}22` }}>
                    <a.icon size={14} style={{ color: a.color }} />
                  </div>
                  {a.label}
                  <ArrowRight size={13} className="ml-auto text-[var(--color-text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
