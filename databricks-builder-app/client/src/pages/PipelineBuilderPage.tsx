import { useState, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, useNodesState, useEdgesState,
  type Node, type Edge, type Connection,
  Handle, Position, NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import {
  Database, Cpu, Layers, Filter, ArrowRight, Play,
  Download, Save, Trash2, Plus, GitBranch, Sparkles
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

// ── Node types ────────────────────────────────────────────
type NodeKind = 'datasource' | 'embedder' | 'vectorstore' | 'llm' | 'prompt' | 'output' | 'filter';

interface PipelineNodeData {
  label: string;
  kind: NodeKind;
  config?: Record<string, string>;
}

const KIND_CONFIG: Record<NodeKind, { color: string; bg: string; icon: React.ComponentType<{ size?: number }> }> = {
  datasource:  { color: 'var(--color-sky)',       bg: 'var(--color-sky-subtle)',        icon: Database  },
  embedder:    { color: 'var(--color-ai-purple)', bg: 'var(--color-ai-purple-subtle)',  icon: Cpu       },
  vectorstore: { color: 'var(--color-emerald)',   bg: 'var(--color-emerald-subtle)',    icon: Layers    },
  llm:         { color: 'var(--color-accent)',    bg: 'var(--color-accent-subtle)',     icon: Sparkles  },
  prompt:      { color: 'var(--color-amber)',     bg: 'var(--color-amber-subtle)',      icon: GitBranch },
  filter:      { color: 'var(--color-rose)',      bg: 'var(--color-rose-subtle)',       icon: Filter    },
  output:      { color: 'var(--color-teal)',      bg: 'rgba(13,148,136,0.08)',          icon: ArrowRight },
};

// ── Custom Node ───────────────────────────────────────────
function PipelineNodeComponent({ data, selected }: NodeProps<PipelineNodeData>) {
  const { color, bg, icon: Icon } = KIND_CONFIG[data.kind];
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border bg-[var(--color-elevated)] shadow-[var(--shadow-md)] min-w-[160px] transition-all',
        selected ? 'ring-2' : ''
      )}
      style={{
        borderColor: selected ? color : 'var(--color-border)',
        boxShadow: selected ? `0 0 0 2px ${color}44, var(--shadow-md)` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, width: 10, height: 10, border: `2px solid var(--color-elevated)` }} />
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="w-7 h-7 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <Icon size={13} style={{ color }} />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-[var(--color-text-heading)] leading-none">{data.label}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 capitalize">{data.kind}</p>
        </div>
      </div>
      {data.config && Object.entries(data.config).slice(0, 2).map(([k, v]) => (
        <div key={k} className="px-3 pb-2 flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--color-text-muted)]">{k}:</span>
          <span className="text-[10px] font-medium text-[var(--color-text-secondary)] truncate max-w-[100px]">{v}</span>
        </div>
      ))}
      <Handle type="source" position={Position.Right} style={{ background: color, width: 10, height: 10, border: `2px solid var(--color-elevated)` }} />
    </div>
  );
}

const nodeTypes = { pipeline: PipelineNodeComponent };

// ── Initial pipeline ──────────────────────────────────────
const INIT_NODES: Node<PipelineNodeData>[] = [
  { id: '1', type: 'pipeline', position: { x: 60,  y: 120 }, data: { label: 'Unity Catalog Table', kind: 'datasource', config: { table: 'my_catalog.docs.raw' } } },
  { id: '2', type: 'pipeline', position: { x: 320, y: 60  }, data: { label: 'Chunk & Clean',        kind: 'filter',     config: { chunk_size: '512', overlap: '50' } } },
  { id: '3', type: 'pipeline', position: { x: 320, y: 200 }, data: { label: 'Text Embedder',        kind: 'embedder',   config: { model: 'bge-m3', dims: '768' } } },
  { id: '4', type: 'pipeline', position: { x: 580, y: 120 }, data: { label: 'Vector Search',        kind: 'vectorstore',config: { endpoint: 'my-vs-endpoint' } } },
  { id: '5', type: 'pipeline', position: { x: 840, y: 60  }, data: { label: 'System Prompt',        kind: 'prompt',     config: { template: 'RAG template' } } },
  { id: '6', type: 'pipeline', position: { x: 840, y: 200 }, data: { label: 'Claude 3.5 Sonnet',   kind: 'llm',        config: { model: 'claude-3-5-sonnet', temp: '0.7' } } },
  { id: '7', type: 'pipeline', position: { x: 1100, y: 120}, data: { label: 'Markdown Output',     kind: 'output',     config: { format: 'markdown' } } },
];

const INIT_EDGES: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: 'var(--color-sky)', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: 'var(--color-sky)', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: 'var(--color-rose)', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: 'var(--color-ai-purple)', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: 'var(--color-emerald)', strokeWidth: 2 } },
  { id: 'e4-6', source: '4', target: '6', animated: true, style: { stroke: 'var(--color-emerald)', strokeWidth: 2 } },
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: 'var(--color-amber)', strokeWidth: 2 } },
  { id: 'e6-7', source: '6', target: '7', animated: true, style: { stroke: 'var(--color-accent)', strokeWidth: 2 } },
];

const NODE_PALETTE: { kind: NodeKind; label: string }[] = [
  { kind: 'datasource',  label: 'Data Source' },
  { kind: 'filter',      label: 'Filter/Chunk' },
  { kind: 'embedder',    label: 'Embedder' },
  { kind: 'vectorstore', label: 'Vector Store' },
  { kind: 'prompt',      label: 'Prompt' },
  { kind: 'llm',         label: 'LLM' },
  { kind: 'output',      label: 'Output' },
];

let nodeIdCounter = INIT_NODES.length + 1;

export default function PipelineBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INIT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INIT_EDGES);
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const addNode = (kind: NodeKind, label: string) => {
    const id = String(++nodeIdCounter);
    const newNode: Node<PipelineNodeData> = {
      id,
      type: 'pipeline',
      position: { x: 200 + Math.random() * 400, y: 150 + Math.random() * 200 },
      data: { label, kind },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const runTest = async () => {
    setRunning(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setTestResult('✅ Pipeline test passed in 1.8s — 3 chunks retrieved, confidence: 0.94');
    setRunning(false);
  };

  const exportYAML = () => {
    const yaml = `pipeline:\n  nodes:\n${nodes.map((n) => `    - id: ${n.id}\n      kind: ${n.data.kind}\n      label: "${n.data.label}"`).join('\n')}\n  edges:\n${edges.map((e) => `    - source: ${e.source}\n      target: ${e.target}`).join('\n')}\n`;
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pipeline.yaml'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-panel)] flex-shrink-0">
          <GitBranch size={15} className="text-[var(--color-text-muted)]" />
          <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">Pipeline Builder</span>
          <span className="badge badge-purple">BETA</span>

          {/* Node palette */}
          <div className="flex items-center gap-1 ml-4">
            {NODE_PALETTE.map((np) => {
              const cfg = KIND_CONFIG[np.kind];
              return (
                <button
                  key={np.kind}
                  onClick={() => addNode(np.kind, np.label)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium border border-transparent hover:border-[var(--color-border)] transition-colors"
                  style={{ color: cfg.color, background: cfg.bg }}
                  title={`Add ${np.label} node`}
                >
                  <Plus size={10} />
                  {np.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={exportYAML} className="btn btn-secondary btn-sm gap-1.5">
              <Download size={12} /> Export YAML
            </button>
            <button
              onClick={runTest}
              disabled={running}
              className="btn btn-primary btn-sm gap-1.5"
            >
              {running ? (
                <><span className="animate-spin-slow inline-block">⟳</span> Running…</>
              ) : (
                <><Play size={12} /> Test Pipeline</>
              )}
            </button>
          </div>
        </div>

        {/* Test result banner */}
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-[var(--color-emerald-subtle)] border-b border-[color-mix(in_srgb,var(--color-emerald)_20%,transparent)] text-[12.5px] font-medium text-[var(--color-emerald)]"
          >
            {testResult}
          </motion.div>
        )}

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="var(--color-border)" gap={24} />
            <Controls />
            <MiniMap
              nodeColor={(n) => KIND_CONFIG[(n.data as PipelineNodeData).kind]?.color ?? '#ccc'}
              style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
            />
          </ReactFlow>
        </div>
      </div>
    </MainLayout>
  );
}
