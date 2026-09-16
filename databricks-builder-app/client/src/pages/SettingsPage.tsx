import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Database, Bell, Shield, Sun, Moon,
  Monitor, Save, AlertTriangle, Key, Trash2, Check
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'databricks' | 'notifications' | 'security';

const TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'general',       label: 'General',       icon: Settings },
  { id: 'databricks',    label: 'Databricks',    icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',      label: 'Security',      icon: Shield },
];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--color-border)] last:border-0">
      <div className="flex-1 mr-8">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{label}</p>
        {description && <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        'w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 relative',
        value ? 'bg-[var(--color-emerald)]' : 'bg-[var(--color-subtle)]'
      )}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ x: value ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function SaveBanner({ show }: { show: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 8 }}
      className={cn(
        'fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border',
        'bg-[var(--color-elevated)] border-[var(--color-border-strong)]',
        'pointer-events-none'
      )}
    >
      <Check size={14} style={{ color: 'var(--color-emerald)' }} />
      <span className="text-[13px] text-[var(--color-text-primary)]">Settings saved</span>
    </motion.div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('general');
  const { fontSize, setFontSize, keymap, setKeymap } = useAppStore();
  const { preference: theme, setPreference: setTheme } = useTheme();
  const [saved, setSaved] = useState(false);

  // Databricks settings state
  const [dbHost, setDbHost] = useState('');
  const [defaultCatalog, setDefaultCatalog] = useState('');
  const [defaultSchema, setDefaultSchema] = useState('');

  // Notification settings
  const [notifExecution, setNotifExecution] = useState(true);
  const [notifErrors, setNotifErrors] = useState(true);
  const [notifSystem, setNotifSystem] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-[800px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-ai-purple-subtle)] flex items-center justify-center">
            <Settings size={16} style={{ color: 'var(--color-ai-purple)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Settings</h2>
            <p className="text-[13px] text-[var(--color-text-muted)]">Platform preferences and configuration</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Tab nav */}
          <nav className="w-44 flex-shrink-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'sidebar-link w-full mb-1',
                  tab === t.id && 'active'
                )}
              >
                <t.icon size={14} className="icon" />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 card p-6">
            {tab === 'general' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-[14px] font-semibold text-[var(--color-text-heading)] mb-4">General</h3>
                <SettingRow label="Theme" description="Choose your preferred color scheme">
                  <div className="flex items-center gap-1">
                    {(['light', 'dark', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn('btn btn-sm gap-1.5 capitalize', theme === t ? 'btn-primary' : 'btn-secondary')}
                      >
                        {t === 'light' ? <Sun size={11} /> : t === 'dark' ? <Moon size={11} /> : <Monitor size={11} />}
                        {t}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Font Size" description="Editor and UI font size">
                  <div className="flex items-center gap-1">
                    {(['sm', 'base', 'lg'] as const).map((s) => (
                      <button key={s} onClick={() => setFontSize(s)} className={cn('btn btn-sm capitalize', fontSize === s ? 'btn-primary' : 'btn-secondary')}>
                        {s === 'sm' ? 'Small' : s === 'base' ? 'Default' : 'Large'}
                      </button>
                    ))}
                  </div>
                </SettingRow>
                <SettingRow label="Editor Keymap" description="Key bindings for the IDE editor">
                  <div className="flex items-center gap-1">
                    {(['default', 'vim', 'emacs'] as const).map((k) => (
                      <button key={k} onClick={() => setKeymap(k)} className={cn('btn btn-sm capitalize', keymap === k ? 'btn-primary' : 'btn-secondary')}>{k}</button>
                    ))}
                  </div>
                </SettingRow>
              </motion.div>
            )}

            {tab === 'databricks' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-[14px] font-semibold text-[var(--color-text-heading)] mb-4">Databricks</h3>
                <SettingRow label="Workspace URL" description="Your Databricks workspace host">
                  <input value={dbHost} onChange={(e) => setDbHost(e.target.value)} placeholder="https://dbc-xxx.cloud.databricks.com" className="input w-64" />
                </SettingRow>
                <SettingRow label="Default Catalog" description="Default Unity Catalog for new conversations">
                  <input value={defaultCatalog} onChange={(e) => setDefaultCatalog(e.target.value)} placeholder="main" className="input w-48" />
                </SettingRow>
                <SettingRow label="Default Schema" description="Default schema within the catalog">
                  <input value={defaultSchema} onChange={(e) => setDefaultSchema(e.target.value)} placeholder="default" className="input w-48" />
                </SettingRow>
              </motion.div>
            )}

            {tab === 'notifications' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-[14px] font-semibold text-[var(--color-text-heading)] mb-4">Notifications</h3>
                <SettingRow label="Execution Completed" description="Notify when an agent task finishes">
                  <Toggle value={notifExecution} onChange={setNotifExecution} />
                </SettingRow>
                <SettingRow label="Execution Errors" description="Alert on agent errors or failures">
                  <Toggle value={notifErrors} onChange={setNotifErrors} />
                </SettingRow>
                <SettingRow label="System Updates" description="Platform and skill update notifications">
                  <Toggle value={notifSystem} onChange={setNotifSystem} />
                </SettingRow>
              </motion.div>
            )}

            {tab === 'security' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="text-[14px] font-semibold text-[var(--color-text-heading)] mb-4">Security</h3>
                <SettingRow label="API Token" description="Databricks personal access token (stored securely)">
                  <div className="flex items-center gap-2">
                    <input type="password" value="••••••••••••••••" readOnly className="input w-40 font-mono" />
                    <button className="btn btn-secondary btn-sm gap-1"><Key size={11} /> Rotate</button>
                  </div>
                </SettingRow>
                <div className="mt-8 p-4 rounded-[var(--radius-lg)] border border-[var(--color-rose)] bg-[var(--color-rose-subtle)]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} style={{ color: 'var(--color-rose)' }} />
                    <p className="text-[13px] font-semibold text-[var(--color-rose)]">Danger Zone</p>
                  </div>
                  <p className="text-[12px] text-[var(--color-rose)] mb-3">These actions are irreversible. Please be certain.</p>
                  <button className="btn btn-danger btn-sm gap-1"><Trash2 size={11} /> Delete all projects</button>
                </div>
              </motion.div>
            )}

            <div className="flex justify-end mt-6">
              <button onClick={save} className="btn btn-primary gap-1.5"><Save size={13} /> Save Changes</button>
            </div>
          </div>
        </div>
      </div>

      <SaveBanner show={saved} />
    </MainLayout>
  );
}
