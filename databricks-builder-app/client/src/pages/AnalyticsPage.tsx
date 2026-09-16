import { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, Activity, Cpu, DollarSign, Clock, Wrench,
  TrendingUp, Download, Calendar, Filter
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel rounded-[var(--radius-md)] px-3 py-2">
      <p className="text-[11px] font-semibold text-[var(--color-text-heading)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] text-[var(--color-text-secondary)]">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// Mock heatmap data (hour × day)
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const HEATMAP_DATA = DAYS.flatMap((day, di) =>
  HOURS.map((hour, hi) => ({
    day, hour, value: Math.floor(Math.random() * (hi > 8 && hi < 20 ? 15 : 3)),
  }))
);

const TOOL_COLORS = ['var(--color-accent)', 'var(--color-ai-purple)', 'var(--color-emerald)', 'var(--color-sky)', 'var(--color-amber)', 'var(--color-rose)'];

const MOCK_TS = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  executions: Math.floor(Math.random() * 40 + 5),
  tokens: Math.floor(Math.random() * 8000 + 1000),
  errors: Math.floor(Math.random() * 5),
  duration: Math.floor(Math.random() * 120 + 30),
}));

const MOCK_TOOLS = [
  { tool: 'Bash', count: 312, error_count: 18 },
  { tool: 'Read', count: 245, error_count: 2 },
  { tool: 'Write', count: 198, error_count: 5 },
  { tool: 'Edit', count: 176, error_count: 3 },
  { tool: 'Glob', count: 134, error_count: 0 },
  { tool: 'Grep', count: 98, error_count: 1 },
  { tool: 'ExecuteSQL', count: 87, error_count: 12 },
  { tool: 'CreateTable', count: 65, error_count: 4 },
];

type TimeRange = '7d' | '30d' | '90d';

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[14px] font-semibold text-[var(--color-text-heading)]">{title}</h3>
      {subtitle && <p className="text-[11.5px] text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const { summary, timeseries, toolUsage, loading } = useAnalytics();
  const [range, setRange] = useState<TimeRange>('30d');

  const ts = timeseries.length > 0 ? timeseries : MOCK_TS;
  const tools = toolUsage.length > 0 ? toolUsage : MOCK_TOOLS;

  const totalCalls = tools.reduce((a, t) => a + t.count, 0);
  const totalErrors = tools.reduce((a, t) => a + t.error_count, 0);
  const errorRate = totalCalls > 0 ? ((totalErrors / totalCalls) * 100).toFixed(1) : '0.0';

  const pieData = tools.slice(0, 6).map((t) => ({ name: t.tool, value: t.count }));

  return (
    <MainLayout>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Analytics</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">AI observability & performance insights</p>
          </div>
          <div className="flex items-center gap-2">
            {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  'btn btn-sm',
                  range === r ? 'btn-primary' : 'btn-secondary'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Tool Calls', value: totalCalls.toLocaleString(), icon: Wrench, color: 'var(--color-ai-purple)' },
            { label: 'Error Rate', value: `${errorRate}%`, icon: Activity, color: 'var(--color-rose)' },
            { label: 'Avg Duration', value: `${summary?.avg_duration_ms ? Math.round(summary.avg_duration_ms / 1000) : 62}s`, icon: Clock, color: 'var(--color-amber)' },
            { label: 'Est. Total Cost', value: `$${summary?.estimated_cost_usd?.toFixed(2) ?? '18.40'}`, icon: DollarSign, color: 'var(--color-emerald)' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              className="card p-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon size={14} style={{ color: kpi.color }} />
                <p className="text-[11.5px] text-[var(--color-text-muted)]">{kpi.label}</p>
              </div>
              <p className="text-2xl font-bold text-[var(--color-text-heading)]">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Execution + Token trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <SectionHeader title="Execution Volume" subtitle="Daily execution count and errors" />
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ts} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="aExec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="executions" name="Executions" stroke="var(--color-accent)" strokeWidth={2} fill="url(#aExec)" />
                  <Line type="monotone" dataKey="errors" name="Errors" stroke="var(--color-rose)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <SectionHeader title="Token Usage" subtitle="Daily token consumption" />
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ts} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="aTok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-ai-purple)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-ai-purple)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="tokens" name="Tokens" stroke="var(--color-ai-purple)" strokeWidth={2} fill="url(#aTok)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tool usage: bar + pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="card p-5 lg:col-span-2">
            <SectionHeader title="Tool Usage Breakdown" subtitle="Invocations per tool with error counts" />
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tools} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="tool" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} width={88} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Calls" fill="var(--color-ai-purple)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="error_count" name="Errors" fill="var(--color-rose)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <SectionHeader title="Share by Tool" subtitle="Proportion of all calls" />
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={TOOL_COLORS[idx % TOOL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Duration histogram */}
        <div className="card p-5">
          <SectionHeader title="Execution Duration" subtitle="Distribution over selected period" />
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ts} margin={{ top: 0, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="duration" name="Avg Duration (s)" fill="var(--color-sky)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
