import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, ChevronRight, ChevronDown, Table2, Columns3,
  Search, Play, RefreshCw, Download, Info, Eye, Tag,
  Hash, ToggleLeft, Calendar, X, Loader2, Filter
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────
type ColType = 'string' | 'long' | 'double' | 'boolean' | 'timestamp' | 'date' | 'binary' | 'array' | 'struct';

interface Column {
  name: string;
  type: ColType;
  nullable: boolean;
  comment?: string;
  tags?: string[];
}

interface TableNode {
  name: string;
  rowCount?: number;
  columns: Column[];
  comment?: string;
}

interface SchemaNode {
  name: string;
  tables: TableNode[];
}

interface CatalogNode {
  name: string;
  schemas: SchemaNode[];
}

// ── Mock catalog data ──────────────────────────────────────
const MOCK_CATALOG: CatalogNode[] = [
  {
    name: 'main',
    schemas: [
      {
        name: 'bronze',
        tables: [
          {
            name: 'orders_raw',
            rowCount: 14_820_300,
            comment: 'Raw orders ingested from Kafka',
            columns: [
              { name: 'order_id', type: 'string', nullable: false, tags: ['pk'] },
              { name: 'customer_id', type: 'string', nullable: false },
              { name: 'amount', type: 'double', nullable: true },
              { name: 'status', type: 'string', nullable: false },
              { name: 'created_at', type: 'timestamp', nullable: false },
              { name: 'updated_at', type: 'timestamp', nullable: false },
            ],
          },
          {
            name: 'customers_raw',
            rowCount: 2_100_000,
            columns: [
              { name: 'customer_id', type: 'string', nullable: false, tags: ['pk'] },
              { name: 'email', type: 'string', nullable: false },
              { name: 'name', type: 'string', nullable: true },
              { name: 'region', type: 'string', nullable: true },
              { name: 'tier', type: 'string', nullable: true },
              { name: 'joined_at', type: 'timestamp', nullable: false },
            ],
          },
        ],
      },
      {
        name: 'silver',
        tables: [
          {
            name: 'orders',
            rowCount: 14_810_000,
            comment: 'Cleaned orders with SCD type 2',
            columns: [
              { name: 'order_id', type: 'string', nullable: false, tags: ['pk'] },
              { name: 'customer_id', type: 'string', nullable: false },
              { name: 'amount', type: 'double', nullable: false },
              { name: 'status', type: 'string', nullable: false },
              { name: 'is_cancelled', type: 'boolean', nullable: false },
              { name: 'created_at', type: 'timestamp', nullable: false },
              { name: '__start_at', type: 'timestamp', nullable: false },
              { name: '__end_at', type: 'timestamp', nullable: true },
            ],
          },
          {
            name: 'customers',
            rowCount: 2_095_400,
            columns: [
              { name: 'customer_id', type: 'string', nullable: false, tags: ['pk'] },
              { name: 'email', type: 'string', nullable: false },
              { name: 'name', type: 'string', nullable: false },
              { name: 'region', type: 'string', nullable: false },
              { name: 'tier', type: 'string', nullable: false },
              { name: 'joined_date', type: 'date', nullable: false },
              { name: 'ltv_usd', type: 'double', nullable: true },
            ],
          },
        ],
      },
      {
        name: 'gold',
        tables: [
          {
            name: 'daily_revenue',
            rowCount: 1825,
            comment: 'Daily revenue aggregates',
            columns: [
              { name: 'date', type: 'date', nullable: false, tags: ['pk'] },
              { name: 'total_revenue', type: 'double', nullable: false },
              { name: 'order_count', type: 'long', nullable: false },
              { name: 'avg_order_value', type: 'double', nullable: false },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'ml_catalog',
    schemas: [
      {
        name: 'features',
        tables: [
          {
            name: 'customer_features',
            rowCount: 2_095_400,
            comment: 'Online feature store for customer ML models',
            columns: [
              { name: 'customer_id', type: 'string', nullable: false, tags: ['pk'] },
              { name: 'days_since_last_order', type: 'long', nullable: true },
              { name: 'total_orders_30d', type: 'long', nullable: true },
              { name: 'avg_order_value_90d', type: 'double', nullable: true },
              { name: 'churn_score', type: 'double', nullable: true },
              { name: 'feature_ts', type: 'timestamp', nullable: false },
            ],
          },
        ],
      },
    ],
  },
];

// ── Type chip ──────────────────────────────────────────────
const TYPE_COLORS: Record<ColType, { bg: string; text: string }> = {
  string:    { bg: 'var(--color-sky-subtle,#e0f2fe)', text: 'var(--color-sky,#0ea5e9)' },
  long:      { bg: 'var(--color-ai-purple-subtle)', text: 'var(--color-ai-purple)' },
  double:    { bg: 'var(--color-ai-purple-subtle)', text: 'var(--color-ai-purple)' },
  boolean:   { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)' },
  timestamp: { bg: 'var(--color-amber-subtle,#fef9c3)', text: 'var(--color-amber)' },
  date:      { bg: 'var(--color-amber-subtle,#fef9c3)', text: 'var(--color-amber)' },
  binary:    { bg: 'var(--color-rose-subtle)', text: 'var(--color-rose)' },
  array:     { bg: 'var(--color-subtle)', text: 'var(--color-text-secondary)' },
  struct:    { bg: 'var(--color-subtle)', text: 'var(--color-text-secondary)' },
};

const TYPE_ICONS: Record<ColType, React.ComponentType<{ size?: number }>> = {
  string: Hash, long: Hash, double: Hash, boolean: ToggleLeft,
  timestamp: Calendar, date: Calendar, binary: Hash, array: Hash, struct: Hash,
};

function TypeChip({ type }: { type: ColType }) {
  const style = TYPE_COLORS[type] ?? { bg: 'var(--color-subtle)', text: 'var(--color-text-muted)' };
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
      style={{ background: style.bg, color: style.text }}
    >
      {type}
    </span>
  );
}

// ── Tree components ────────────────────────────────────────
function ColumnRow({ col, onPreview }: { col: Column; onPreview: () => void }) {
  const Icon = TYPE_ICONS[col.type] ?? Hash;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-subtle)] group cursor-pointer transition-colors"
      onClick={onPreview}
    >
      <Icon size={11} style={{ color: 'var(--color-text-muted)' }} className="flex-shrink-0" />
      <span className="text-[12px] text-[var(--color-text-primary)] flex-1 font-mono">{col.name}</span>
      {col.tags?.map((t) => (
        <span key={t} className="badge badge-purple text-[9px]">{t}</span>
      ))}
      <TypeChip type={col.type} />
      {col.nullable ? null : (
        <span className="badge badge-neutral text-[9px] opacity-60">NOT NULL</span>
      )}
    </div>
  );
}

function TableRow({
  catalog, schema, table, onSelect, selected,
}: {
  catalog: string; schema: string; table: TableNode; onSelect: (c: string, s: string, t: TableNode) => void; selected: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => { setOpen((v) => !v); onSelect(catalog, schema, table); }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-[var(--color-subtle)] transition-colors group',
          selected && 'bg-[var(--color-accent-subtle)]'
        )}
      >
        {open ? <ChevronDown size={11} className="flex-shrink-0 text-[var(--color-text-muted)]" /> : <ChevronRight size={11} className="flex-shrink-0 text-[var(--color-text-muted)]" />}
        <Table2 size={11} style={{ color: selected ? 'var(--color-accent)' : 'var(--color-text-secondary)' }} className="flex-shrink-0" />
        <span className={cn('text-[12px] flex-1 font-mono', selected ? 'text-[var(--color-accent)] font-semibold' : 'text-[var(--color-text-primary)]')}>{table.name}</span>
        {table.rowCount !== undefined && (
          <span className="text-[10px] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
            {table.rowCount.toLocaleString()} rows
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="ml-6 border-l border-[var(--color-border)]">
              {table.columns.map((col) => (
                <ColumnRow key={col.name} col={col} onPreview={() => onSelect(catalog, schema, table)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SQL Preview pane ───────────────────────────────────────
function SQLPreview({
  catalog, schema, table, onClose,
}: {
  catalog: string; schema: string; table: TableNode; onClose: () => void;
}) {
  const [query, setQuery] = useState(`SELECT *\nFROM ${catalog}.${schema}.${table.name}\nLIMIT 100`);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { columns: string[]; rows: unknown[][] }>(null);

  const runQuery = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1000));
    // Mock result
    setResult({
      columns: table.columns.slice(0, 5).map((c) => c.name),
      rows: Array.from({ length: 10 }, (_, i) =>
        table.columns.slice(0, 5).map((c) => {
          if (c.type === 'string') return `val_${i}`;
          if (c.type === 'boolean') return i % 2 === 0;
          if (c.type === 'timestamp') return '2024-01-15 08:32:11';
          if (c.type === 'date') return '2024-01-15';
          return i * 100 + 42;
        })
      ),
    });
    setRunning(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
        <Table2 size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-[13px] font-semibold text-[var(--color-text-heading)] font-mono">
          {catalog}.{schema}.<span style={{ color: 'var(--color-accent)' }}>{table.name}</span>
        </span>
        {table.rowCount !== undefined && (
          <span className="badge badge-neutral ml-1">{table.rowCount.toLocaleString()} rows</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-secondary btn-sm gap-1"><Download size={11} /> Export</button>
          <button onClick={onClose} className="btn btn-ghost btn-sm"><X size={13} /></button>
        </div>
      </div>

      {/* Table comment */}
      {table.comment && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-ai-purple-subtle)] border-b border-[var(--color-border)]">
          <Info size={11} style={{ color: 'var(--color-ai-purple)' }} />
          <p className="text-[11.5px] text-[var(--color-ai-purple)]">{table.comment}</p>
        </div>
      )}

      {/* Schema */}
      <div className="border-b border-[var(--color-border)] max-h-40 overflow-y-auto">
        <p className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Schema</p>
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--color-subtle)]">
              {['Column', 'Type', 'Nullable', 'Comment'].map((h) => (
                <th key={h} className="px-3 py-1.5 text-left text-[10px] font-semibold text-[var(--color-text-muted)] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.columns.map((col) => (
              <tr key={col.name} className="border-t border-[var(--color-border)] hover:bg-[var(--color-subtle)]">
                <td className="px-3 py-1.5 text-[11.5px] font-mono text-[var(--color-text-primary)]">{col.name}</td>
                <td className="px-3 py-1.5"><TypeChip type={col.type} /></td>
                <td className="px-3 py-1.5 text-[11px] text-[var(--color-text-muted)]">{col.nullable ? 'YES' : 'NO'}</td>
                <td className="px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] italic">{col.comment ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SQL editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-code-bg)] border-b border-[var(--color-border)]">
          <p className="text-[10.5px] font-semibold text-[var(--color-text-muted)]">SQL QUERY</p>
          <button
            onClick={runQuery}
            disabled={running}
            className="btn btn-primary btn-sm gap-1"
          >
            {running ? <Loader2 size={11} className="animate-spin-slow" /> : <Play size={11} />}
            {running ? 'Running…' : 'Run Query'}
          </button>
        </div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-shrink-0 px-4 py-3 bg-[var(--color-code-bg)] text-[12.5px] font-mono text-[var(--color-code-text)] border-0 outline-none resize-none border-b border-[var(--color-border)]"
          rows={4}
        />

        {/* Results */}
        {result && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-[var(--color-subtle)] sticky top-0">
                  {result.columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-semibold text-[var(--color-text-muted)] border-b border-[var(--color-border)] font-mono">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-subtle)] transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-[var(--color-text-primary)] font-mono">{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function CatalogPage() {
  const [catalog] = useState<CatalogNode[]>(MOCK_CATALOG);
  const [openCatalogs, setOpenCatalogs] = useState<Set<string>>(new Set(['main']));
  const [openSchemas, setOpenSchemas] = useState<Set<string>>(new Set(['main.bronze']));
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ catalog: string; schema: string; table: TableNode } | null>(null);

  const toggleCatalog = (name: string) => {
    setOpenCatalogs((prev) => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  };
  const toggleSchema = (key: string) => {
    setOpenSchemas((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  };

  const filteredCatalogs = catalog.map((cat) => ({
    ...cat,
    schemas: cat.schemas.map((sc) => ({
      ...sc,
      tables: sc.tables.filter((t) =>
        search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        sc.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.name.toLowerCase().includes(search.toLowerCase())
      ),
    })).filter((sc) => sc.tables.length > 0 || search === ''),
  }));

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-48px)]">
        {/* Tree panel */}
        <div className="w-72 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col bg-[var(--color-sidebar-bg)]">
          <div className="px-3 py-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} style={{ color: 'var(--color-accent)' }} />
              <p className="text-[13px] font-semibold text-[var(--color-text-heading)]">Unity Catalog</p>
            </div>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tables…" className="input pl-7 text-[12px]" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {filteredCatalogs.map((cat) => (
              <div key={cat.name}>
                {/* Catalog */}
                <button
                  onClick={() => toggleCatalog(cat.name)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-subtle)] transition-colors"
                >
                  {openCatalogs.has(cat.name)
                    ? <ChevronDown size={12} className="text-[var(--color-text-muted)]" />
                    : <ChevronRight size={12} className="text-[var(--color-text-muted)]" />}
                  <Database size={13} style={{ color: 'var(--color-accent)' }} />
                  <span className="text-[12.5px] font-semibold text-[var(--color-text-primary)]">{cat.name}</span>
                </button>

                <AnimatePresence>
                  {openCatalogs.has(cat.name) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      {cat.schemas.map((sc) => {
                        const key = `${cat.name}.${sc.name}`;
                        return (
                          <div key={sc.name} className="ml-4">
                            {/* Schema */}
                            <button
                              onClick={() => toggleSchema(key)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--color-subtle)] transition-colors"
                            >
                              {openSchemas.has(key)
                                ? <ChevronDown size={11} className="text-[var(--color-text-muted)]" />
                                : <ChevronRight size={11} className="text-[var(--color-text-muted)]" />}
                              <Columns3 size={11} style={{ color: 'var(--color-ai-purple)' }} />
                              <span className="text-[12px] text-[var(--color-text-secondary)]">{sc.name}</span>
                              <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">{sc.tables.length}</span>
                            </button>

                            <AnimatePresence>
                              {openSchemas.has(key) && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden ml-4">
                                  {sc.tables.map((tbl) => (
                                    <TableRow
                                      key={tbl.name}
                                      catalog={cat.name}
                                      schema={sc.name}
                                      table={tbl}
                                      selected={selected?.table.name === tbl.name && selected?.schema === sc.name && selected?.catalog === cat.name}
                                      onSelect={(c, s, t) => setSelected({ catalog: c, schema: s, table: t })}
                                    />
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {selected ? (
              <SQLPreview
                key={`${selected.catalog}.${selected.schema}.${selected.table.name}`}
                catalog={selected.catalog}
                schema={selected.schema}
                table={selected.table}
                onClose={() => setSelected(null)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center gap-3"
              >
                <Database size={44} className="opacity-10" style={{ color: 'var(--color-accent)' }} />
                <p className="text-[14px] font-medium text-[var(--color-text-muted)]">Select a table to explore</p>
                <p className="text-[12px] text-[var(--color-text-muted)]">Browse the catalog tree on the left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
