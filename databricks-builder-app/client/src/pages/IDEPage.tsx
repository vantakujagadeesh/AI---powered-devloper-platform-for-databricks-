import { useState, useCallback } from 'react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion } from 'framer-motion';
import {
  FolderOpen, File, ChevronRight, ChevronDown,
  Plus, Trash2, Save, X, Code2, FileText, Database,
  Settings, AlertCircle, Terminal as TerminalIcon
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useEditorStore, type EditorTab } from '@/stores/editorStore';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

// ── File tree mock ────────────────────────────────────────
interface FileNode {
  name: string;
  type: 'file' | 'dir';
  children?: FileNode[];
  language?: string;
  content?: string;
}

const SAMPLE_TREE: FileNode[] = [
  {
    name: 'my_project', type: 'dir', children: [
      { name: 'pipeline.py', type: 'file', language: 'python', content: `# Databricks Pipeline\nfrom pyspark.sql import SparkSession\n\nspark = SparkSession.builder.getOrCreate()\n\ndf = spark.read.table("my_catalog.bronze.events")\ndf_clean = df.dropna().distinct()\ndf_clean.write.mode("overwrite").saveAsTable("my_catalog.silver.events")\nprint(f"Processed {df_clean.count()} rows")\n` },
      { name: 'query.sql', type: 'file', language: 'sql', content: `-- Analytics Query\nSELECT\n  date_trunc('day', event_time) AS day,\n  COUNT(*) AS events,\n  COUNT(DISTINCT user_id) AS unique_users\nFROM my_catalog.silver.events\nWHERE event_time >= CURRENT_DATE - INTERVAL 30 DAYS\nGROUP BY 1\nORDER BY 1 DESC\nLIMIT 100;\n` },
      { name: 'config.yaml', type: 'file', language: 'yaml', content: `# Project config\nproject:\n  name: my_project\n  catalog: my_catalog\n  schema: silver\n  cluster_id: null\n\nagent:\n  model: claude-3-5-sonnet-latest\n  max_turns: 50\n` },
      {
        name: 'notebooks', type: 'dir', children: [
          { name: 'exploration.py', type: 'file', language: 'python', content: `# Databricks Notebook\n# COMMAND ----------\nimport pandas as pd\ndf = spark.table("my_catalog.silver.events").toPandas()\ndf.head()\n` },
        ]
      },
    ]
  }
];

function getLanguageIcon(lang?: string) {
  if (lang === 'python') return { icon: Code2, color: 'var(--color-ai-purple)' };
  if (lang === 'sql') return { icon: Database, color: 'var(--color-sky)' };
  if (lang === 'yaml' || lang === 'json') return { icon: Settings, color: 'var(--color-amber)' };
  return { icon: FileText, color: 'var(--color-text-muted)' };
}

// ── File Tree Node ────────────────────────────────────────
function FileTreeNode({ node, depth = 0, onOpen }: { node: FileNode; depth?: number; onOpen: (n: FileNode) => void }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isDir = node.type === 'dir';
  const { icon: LangIcon, color } = getLanguageIcon(node.language);

  return (
    <div>
      <button
        className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-[12.5px] text-[var(--color-text-secondary)] hover:bg-[var(--color-subtle)] hover:text-[var(--color-text-primary)] transition-colors text-left"
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => isDir ? setExpanded(!expanded) : onOpen(node)}
      >
        {isDir ? (
          expanded ? <ChevronDown size={12} className="flex-shrink-0" /> : <ChevronRight size={12} className="flex-shrink-0" />
        ) : (
          <LangIcon size={12} style={{ color }} className="flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDir && expanded && node.children?.map((child) => (
        <FileTreeNode key={child.name} node={child} depth={depth + 1} onOpen={onOpen} />
      ))}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────
function TabBar({ tabs, activeTabId, onSelect, onClose }: { tabs: EditorTab[]; activeTabId: string | null; onSelect: (id: string) => void; onClose: (id: string) => void }) {
  if (tabs.length === 0) return null;
  return (
    <div className="flex items-center overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-panel)]" style={{ scrollbarWidth: 'none' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-[12px] border-r border-[var(--color-border)] flex-shrink-0 transition-colors',
            tab.id === activeTabId
              ? 'bg-[var(--color-elevated)] text-[var(--color-text-primary)] border-t-2 border-t-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-subtle)]'
          )}
        >
          {tab.dirty && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] flex-shrink-0" />}
          <span className="max-w-[120px] truncate">{tab.fileName}</span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={11} />
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Terminal Pane (mock) ──────────────────────────────────
function TerminalPane() {
  const [lines, setLines] = useState<string[]>([
    '\x1b[32m→\x1b[0m Databricks CLI connected',
    '\x1b[34mworkspace:\x1b[0m https://dbc-abc.cloud.databricks.com',
    '\x1b[90m$\x1b[0m ',
  ]);
  const [input, setInput] = useState('');

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const cmd = input.trim();
    setLines((l) => [...l, `\x1b[90m$\x1b[0m ${cmd}`, `\x1b[33mRunning:\x1b[0m ${cmd}...`, '\x1b[90m$\x1b[0m ']);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-code-bg)] font-mono text-[12px]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-panel)]">
        <TerminalIcon size={12} className="text-[var(--color-text-muted)]" />
        <span className="text-[11px] text-[var(--color-text-muted)]">Terminal — Databricks Cluster</span>
        <span className="badge badge-success ml-auto">Connected</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-[var(--color-code-text)]">
        {lines.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\x1b\[(\d+)m/g, '') }} className="leading-relaxed" />
        ))}
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-text-muted)]">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleEnter}
            className="flex-1 bg-transparent border-0 outline-none text-[var(--color-text-primary)]"
            placeholder="Enter command…"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

// ── Main IDE Page ─────────────────────────────────────────
export default function IDEPage() {
  const { tabs, activeTabId, openTab, closeTab, setActiveTab, updateContent } = useEditorStore();
  const { resolvedTheme } = useTheme();
  const [showTerminal, setShowTerminal] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleOpenFile = useCallback((node: FileNode) => {
    if (!node.content) return;
    openTab({
      id: `tab-${node.name}-${Date.now()}`,
      filePath: node.name,
      fileName: node.name,
      language: node.language ?? 'plaintext',
      content: node.content,
    });
  }, [openTab]);

  return (
    <MainLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* IDE Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] flex-shrink-0">
          <span className="text-[12px] font-semibold text-[var(--color-text-heading)]">IDE</span>
          <span className="badge badge-purple">BETA</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowTerminal((v) => !v)}
              className={cn('btn btn-sm btn-secondary gap-1.5', showTerminal && 'btn-primary')}
            >
              <TerminalIcon size={12} /> Terminal
            </button>
            {activeTab && (
              <button className="btn btn-sm btn-primary gap-1.5">
                <Save size={12} /> Save
              </button>
            )}
          </div>
        </div>

        {/* Main split */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* File tree */}
            <Panel defaultSize={18} minSize={12} maxSize={30}>
              <div className="h-full border-r border-[var(--color-border)] bg-[var(--color-panel)] overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Explorer</span>
                  <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                    <Plus size={13} />
                  </button>
                </div>
                <div className="py-1">
                  {SAMPLE_TREE.map((node) => (
                    <FileTreeNode key={node.name} node={node} onOpen={handleOpenFile} />
                  ))}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-[3px] bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors cursor-col-resize" />

            {/* Editor + terminal */}
            <Panel>
              <PanelGroup direction="vertical">
                <Panel defaultSize={showTerminal ? 65 : 100}>
                  <div className="h-full flex flex-col overflow-hidden">
                    <TabBar
                      tabs={tabs}
                      activeTabId={activeTabId}
                      onSelect={setActiveTab}
                      onClose={closeTab}
                    />
                    {activeTab ? (
                      <div className="flex-1 overflow-hidden">
                        <Editor
                          height="100%"
                          language={activeTab.language}
                          value={activeTab.content}
                          theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
                          onChange={(v) => updateContent(activeTab.id, v ?? '')}
                          options={{
                            fontSize: 13,
                            fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            lineNumbers: 'on',
                            padding: { top: 12, bottom: 12 },
                            renderLineHighlight: 'line',
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            cursorSmoothCaretAnimation: 'on',
                            folding: true,
                            wordWrap: 'on',
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <Code2 size={40} className="text-[var(--color-text-muted)] opacity-30 mb-4" />
                        <p className="text-[14px] font-medium text-[var(--color-text-secondary)]">Select a file to edit</p>
                        <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Click a file in the explorer panel</p>
                      </div>
                    )}
                  </div>
                </Panel>

                {showTerminal && (
                  <>
                    <PanelResizeHandle className="h-[3px] bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors cursor-row-resize" />
                    <Panel defaultSize={35} minSize={20}>
                      <TerminalPane />
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </MainLayout>
  );
}
