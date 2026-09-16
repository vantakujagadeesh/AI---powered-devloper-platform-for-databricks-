import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, UserPlus, Search, MoreHorizontal,
  CheckCircle2, AlertCircle, Clock, Filter, Download,
  Activity, Database, Trash2, Edit, ChevronDown
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'editor' | 'viewer';

interface User {
  email: string;
  name: string;
  role: Role;
  lastActive: string;
  executions: number;
  tokensUsed: number;
}

interface AuditEvent {
  id: string;
  user: string;
  action: string;
  resource: string;
  ip: string;
  time: string;
  status: 'success' | 'error' | 'warning';
}

const MOCK_USERS: User[] = [
  { email: 'alice@company.com', name: 'Alice Chen', role: 'admin',  lastActive: '2m ago',  executions: 142, tokensUsed: 284000 },
  { email: 'bob@company.com',   name: 'Bob Kumar', role: 'editor', lastActive: '1h ago',  executions: 87,  tokensUsed: 156000 },
  { email: 'carol@company.com', name: 'Carol Smith', role: 'editor', lastActive: '3h ago', executions: 56, tokensUsed: 98000 },
  { email: 'dave@company.com',  name: 'Dave Okonkwo', role: 'viewer', lastActive: '1d ago', executions: 12, tokensUsed: 18000 },
  { email: 'eve@company.com',   name: 'Eve Martinez', role: 'viewer', lastActive: '5d ago', executions: 4, tokensUsed: 5200 },
];

const MOCK_AUDIT: AuditEvent[] = [
  { id: 'a1', user: 'alice@company.com', action: 'invoke_agent',      resource: 'project:my-etl',   ip: '10.0.1.4',  time: '2m ago',   status: 'success' },
  { id: 'a2', user: 'bob@company.com',   action: 'delete_conversation',resource: 'conv:abc123',      ip: '10.0.1.7',  time: '14m ago',  status: 'success' },
  { id: 'a3', user: 'carol@company.com', action: 'install_skill',      resource: 'skill:databricks-ml', ip: '10.0.2.1', time: '28m ago', status: 'success' },
  { id: 'a4', user: 'dave@company.com',  action: 'access_denied',      resource: 'admin_panel',      ip: '10.0.3.9',  time: '1h ago',   status: 'error' },
  { id: 'a5', user: 'alice@company.com', action: 'change_user_role',   resource: 'user:dave',        ip: '10.0.1.4',  time: '2h ago',   status: 'warning' },
  { id: 'a6', user: 'alice@company.com', action: 'create_project',     resource: 'project:new-rag',  ip: '10.0.1.4',  time: '3h ago',   status: 'success' },
];

const ROLE_CONFIG: Record<Role, { label: string; badge: string; color: string }> = {
  admin:  { label: 'Admin',  badge: 'badge-error',   color: 'var(--color-rose)' },
  editor: { label: 'Editor', badge: 'badge-purple',  color: 'var(--color-ai-purple)' },
  viewer: { label: 'Viewer', badge: 'badge-neutral', color: 'var(--color-text-muted)' },
};

const AUDIT_STATUS = {
  success: { icon: CheckCircle2, color: 'var(--color-emerald)' },
  error:   { icon: AlertCircle,  color: 'var(--color-rose)' },
  warning: { icon: AlertCircle,  color: 'var(--color-amber)' },
};

type AdminTab = 'users' | 'audit' | 'health';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');

  const filteredAudit = MOCK_AUDIT.filter(
    (e) => e.user.includes(search) || e.action.includes(search) || e.resource.includes(search)
  );

  const changeRole = (email: string, role: Role) => {
    setUsers((prev) => prev.map((u) => u.email === email ? { ...u, role } : u));
  };

  const TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'users',  label: 'Users & Roles', icon: Users },
    { id: 'audit',  label: 'Audit Log',     icon: Activity },
    { id: 'health', label: 'System Health', icon: Database },
  ];

  return (
    <MainLayout>
      <div className="p-6 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-rose-subtle)] flex items-center justify-center">
            <Shield size={16} style={{ color: 'var(--color-rose)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Admin Panel</h2>
            <p className="text-[13px] text-[var(--color-text-muted)]">Manage users, audit logs, and system health</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)] pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-all',
                tab === t.id
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab === 'audit' ? 'audit events' : 'users'}…`} className="input pl-8" />
        </div>

        {/* Users tab */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-subtle)]">
                  {['User', 'Role', 'Last Active', 'Executions', 'Tokens Used', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.filter((u) => u.email.includes(search) || u.name.includes(search)).map((user, i) => {
                  const roleCfg = ROLE_CONFIG[user.role];
                  return (
                    <motion.tr
                      key={user.email}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-subtle)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{user.name}</p>
                            <p className="text-[11px] text-[var(--color-text-muted)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.email, e.target.value as Role)}
                          className={cn('badge cursor-pointer border-0 outline-none appearance-none pr-4', roleCfg.badge)}
                          style={{ background: 'transparent' }}
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)]">{user.lastActive}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-primary)] font-medium">{user.executions}</td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-muted)]">{(user.tokensUsed / 1000).toFixed(0)}K</td>
                      <td className="px-4 py-3">
                        <button className="btn btn-ghost btn-sm text-[var(--color-rose)] hover:bg-[var(--color-rose-subtle)]"><Trash2 size={13} /></button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit log tab */}
        {tab === 'audit' && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-subtle)]">
              <p className="text-[12px] font-semibold text-[var(--color-text-heading)]">{filteredAudit.length} events</p>
              <button className="btn btn-secondary btn-sm gap-1"><Download size={11} /> Export</button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-subtle)]">
                  {['Status', 'User', 'Action', 'Resource', 'IP Address', 'Time'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((event, i) => {
                  const statusCfg = AUDIT_STATUS[event.status];
                  return (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-subtle)] transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <statusCfg.icon size={14} style={{ color: statusCfg.color }} />
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[var(--color-text-muted)]">{event.user.split('@')[0]}</td>
                      <td className="px-4 py-2.5 text-[12px] font-mono text-[var(--color-text-primary)]">{event.action}</td>
                      <td className="px-4 py-2.5 text-[12px] text-[var(--color-text-muted)]">{event.resource}</td>
                      <td className="px-4 py-2.5 text-[11px] font-mono text-[var(--color-text-muted)]">{event.ip}</td>
                      <td className="px-4 py-2.5 text-[11.5px] text-[var(--color-text-muted)]">{event.time}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Health tab */}
        {tab === 'health' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'API Server', status: 'healthy', value: '99.98% uptime', color: 'emerald' },
              { label: 'Database (Lakebase)', status: 'healthy', value: '12ms avg latency', color: 'emerald' },
              { label: 'Active Streams', status: 'healthy', value: '3 active SSE', color: 'emerald' },
              { label: 'Backup Worker', status: 'healthy', value: 'Last run 5m ago', color: 'emerald' },
              { label: 'Execution Queue', status: 'warning', value: '8 pending jobs', color: 'amber' },
              { label: 'MCP Gateway', status: 'healthy', value: '42 tools exposed', color: 'emerald' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="card p-4 flex items-center gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={cn('status-dot flex-shrink-0', item.status === 'healthy' ? 'done' : 'pending')} />
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{item.label}</p>
                  <p className="text-[11.5px] text-[var(--color-text-muted)]">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
