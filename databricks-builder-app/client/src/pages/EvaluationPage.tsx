import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlaskConical, Play, ChevronRight, Star, StarOff, Plus,
  Copy, Check, Download, Loader2, Sliders, Info, X,
  ChevronDown, ChevronUp, BarChart2, ArrowRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────
interface ModelConfig {
  id: string;
  label: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface EvalResult {
  configId: string;
  output: string;
  latencyMs: number;
  tokens: number;
  score: number | null; // 1-5
  loading: boolean;
  error?: string;
}

interface EvalRun {
  id: string;
  prompt: string;
  results: EvalResult[];
  createdAt: Date;
}

// ── Default configs ────────────────────────────────────────
const DEFAULT_CONFIGS: ModelConfig[] = [
  {
    id: 'a',
    label: 'Config A',
    model: 'claude-sonnet-4-5',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: 'You are a helpful Databricks expert.',
  },
  {
    id: 'b',
    label: 'Config B',
    model: 'claude-sonnet-4-5',
    temperature: 0.2,
    maxTokens: 4096,
    systemPrompt: 'You are a concise Databricks expert. Be brief and precise.',
  },
];

const QUICK_PROMPTS = [
  'Write a Delta Live Table pipeline for an orders table with SCD type 2.',
  'Explain the difference between MERGE and REPLACE WHERE in Delta Lake.',
  'Write a PySpark job to read Kafka, apply a windowed aggregation, and write to Delta.',
  'How do I implement row-level security in Unity Catalog?',
  'Generate MLflow experiment tracking code for a LightGBM model.',
];

// ── Score stars ────────────────────────────────────────────
function ScoreStars({ score, onChange }: { score: number | null; onChange: (s: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          onMouseEnter={() => setHover(v)}
          onMouseLeave={() => setHover(null)}
          className="text-[var(--color-amber)] transition-transform hover:scale-125"
        >
          {(hover ?? score ?? 0) >= v ? (
            <Star size={14} fill="var(--color-amber)" stroke="var(--color-amber)" />
          ) : (
            <Star size={14} className="opacity-30" />
          )}
        </button>
      ))}
      {score && <span className="text-[11px] text-[var(--color-text-muted)] ml-1">{score}/5</span>}
    </div>
  );
}

// ── Config card ────────────────────────────────────────────
function ConfigCard({
  config,
  onChange,
}: {
  config: ModelConfig;
  onChange: (c: ModelConfig) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: config.id === 'a' ? 'var(--color-accent)' : 'var(--color-ai-purple)' }}
          >
            {config.label.split(' ')[1]}
          </div>
          <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">{config.label}</span>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="btn btn-ghost btn-sm gap-1 text-[11px]">
          <Sliders size={11} /> {expanded ? 'Hide' : 'Configure'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1 pb-2">
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1 block">Model</label>
                <select
                  value={config.model}
                  onChange={(e) => onChange({ ...config, model: e.target.value })}
                  className="input text-[12px]"
                >
                  <option value="claude-sonnet-4-5">claude-sonnet-4-5</option>
                  <option value="claude-haiku-4-5">claude-haiku-4-5</option>
                  <option value="claude-opus-4-5">claude-opus-4-5</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1 block">
                  Temperature: <span className="text-[var(--color-accent)] font-semibold">{config.temperature}</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={config.temperature}
                  onChange={(e) => onChange({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1 block">Max Tokens</label>
                <input
                  type="number" min="256" max="8192" step="256"
                  value={config.maxTokens}
                  onChange={(e) => onChange({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="input text-[12px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-muted)] mb-1 block">System Prompt</label>
                <textarea
                  value={config.systemPrompt}
                  onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })}
                  rows={3}
                  className="input text-[12px] resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary when collapsed */}
      {!expanded && (
        <div className="flex flex-wrap gap-1.5 text-[10.5px]">
          <span className="badge badge-neutral">{config.model}</span>
          <span className="badge badge-neutral">temp {config.temperature}</span>
          <span className="badge badge-neutral">{config.maxTokens} tok</span>
        </div>
      )}
    </div>
  );
}

// ── Result panel ───────────────────────────────────────────
function ResultPanel({
  config,
  result,
  onScore,
}: {
  config: ModelConfig;
  result: EvalResult;
  onScore: (s: number) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(result.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card flex flex-col overflow-hidden h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] flex-shrink-0">
        <div
          className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ background: config.id === 'a' ? 'var(--color-accent)' : 'var(--color-ai-purple)' }}
        >
          {config.label.split(' ')[1]}
        </div>
        <span className="text-[13px] font-semibold text-[var(--color-text-heading)] flex-1">{config.label}</span>
        {!result.loading && result.output && (
          <>
            <span className="text-[10.5px] text-[var(--color-text-muted)]">{(result.latencyMs / 1000).toFixed(1)}s · {result.tokens} tok</span>
            <button onClick={copy} className="btn btn-ghost btn-sm">{copied ? <Check size={11} /> : <Copy size={11} />}</button>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {result.loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-[var(--color-text-muted)]">
            <Loader2 size={16} className="animate-spin-slow" />
            <span className="text-[13px]">Running…</span>
          </div>
        ) : result.error ? (
          <p className="text-[var(--color-rose)] text-[13px]">{result.error}</p>
        ) : (
          <pre className="whitespace-pre-wrap text-[12.5px] text-[var(--color-text-primary)] leading-relaxed font-sans">
            {result.output}
          </pre>
        )}
      </div>

      {/* Score */}
      {!result.loading && result.output && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-[var(--color-border)] flex-shrink-0 bg-[var(--color-subtle)]">
          <span className="text-[11px] text-[var(--color-text-muted)]">Rate output:</span>
          <ScoreStars score={result.score} onChange={onScore} />
        </div>
      )}
    </div>
  );
}

// ── Eval history row ───────────────────────────────────────
function HistoryRow({ run }: { run: EvalRun }) {
  const [exp, setExp] = useState(false);
  const scores = run.results.filter((r) => r.score !== null);
  return (
    <div className="card overflow-hidden text-[12px]">
      <button
        onClick={() => setExp((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-subtle)] transition-colors"
      >
        <BarChart2 size={13} style={{ color: 'var(--color-ai-purple)' }} />
        <span className="flex-1 text-[var(--color-text-primary)] truncate">{run.prompt}</span>
        {scores.length > 0 && (
          <div className="flex gap-1">
            {run.results.map((r) => (
              <span key={r.configId} className="badge badge-success text-[10px]">
                {r.configId.toUpperCase()}: {r.score}/5
              </span>
            ))}
          </div>
        )}
        <span className="text-[var(--color-text-muted)] text-[11px]">{run.createdAt.toLocaleTimeString()}</span>
        {exp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      <AnimatePresence>
        {exp && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--color-border)]"
          >
            <div className="grid grid-cols-2 gap-3 p-3" style={{ minHeight: 200, maxHeight: 300 }}>
              {run.results.map((r) => {
                const cfg = DEFAULT_CONFIGS.find((c) => c.id === r.configId)!;
                return (
                  <div key={r.configId} className="bg-[var(--color-subtle)] rounded-[var(--radius-md)] p-3 overflow-y-auto">
                    <p className="text-[11px] font-semibold mb-2" style={{ color: cfg.id === 'a' ? 'var(--color-accent)' : 'var(--color-ai-purple)' }}>
                      {cfg.label} {r.score ? `— ${r.score}/5 ⭐` : ''}
                    </p>
                    <pre className="text-[11px] whitespace-pre-wrap text-[var(--color-text-secondary)] leading-relaxed">{r.output}</pre>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────
export default function EvaluationPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>(DEFAULT_CONFIGS);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<EvalResult[]>([]);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<EvalRun[]>([]);
  const [tab, setTab] = useState<'run' | 'history'>('run');

  const updateConfig = (updated: ModelConfig) => {
    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const updateScore = (configId: string, score: number) => {
    setResults((prev) => prev.map((r) => (r.configId === configId ? { ...r, score } : r)));
    setHistory((prev) =>
      prev.map((run) =>
        run.results.some((r) => r.configId === configId && run.prompt === prompt)
          ? { ...run, results: run.results.map((r) => (r.configId === configId ? { ...r, score } : r)) }
          : run
      )
    );
  };

  const runEval = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setTab('run');

    const initResults: EvalResult[] = configs.map((c) => ({
      configId: c.id,
      output: '',
      latencyMs: 0,
      tokens: 0,
      score: null,
      loading: true,
    }));
    setResults(initResults);

    // Simulate parallel LLM calls (replace with real API when available)
    const run: EvalRun = { id: Date.now().toString(), prompt, results: initResults, createdAt: new Date() };

    await Promise.all(
      configs.map(async (cfg) => {
        const t0 = Date.now();
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 1400));
        const latencyMs = Date.now() - t0;
        const MOCK_OUTPUTS: Record<string, string> = {
          a: `Here's a Delta Live Table pipeline with SCD Type 2 for the orders table:\n\n@dlt.table()\ndef orders_bronze():\n    return spark.readStream.table("raw.orders")\n\n@dlt.table(comment="Orders with SCD Type 2")\ndef orders_silver():\n    return (\n        dlt.read_stream("orders_bronze")\n           .apply_changes(\n               target="orders_silver",\n               source="orders_bronze",\n               keys=["order_id"],\n               sequence_by="updated_at",\n               stored_as_scd_type="2"\n           )\n    )\n\nThis creates a full history of changes with __START_AT and __END_AT columns.`,
          b: `Use DLT's apply_changes() for SCD2:\n\n@dlt.table()\ndef orders_silver():\n    return dlt.read_stream("orders_bronze").apply_changes(\n        target="orders_silver",\n        source="orders_bronze",\n        keys=["order_id"],\n        sequence_by="updated_at",\n        stored_as_scd_type="2"\n    )\n\nSCD2 stores historical rows with __START_AT/__END_AT timestamps automatically.`,
        };
        const out = MOCK_OUTPUTS[cfg.id] ?? 'Response from ' + cfg.model;
        const finalResult: EvalResult = {
          configId: cfg.id,
          output: out,
          latencyMs,
          tokens: Math.floor(out.split(' ').length * 1.3),
          score: null,
          loading: false,
        };
        setResults((prev) => prev.map((r) => (r.configId === cfg.id ? finalResult : r)));
        run.results = run.results.map((r) => (r.configId === cfg.id ? finalResult : r));
      })
    );

    setHistory((prev) => [run, ...prev]);
    setRunning(false);
  }, [prompt, configs, running]);

  return (
    <MainLayout>
      <div className="p-6 max-w-[1300px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Evaluation Studio</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
              Compare model configs side-by-side and score outputs
            </p>
          </div>
          <div className="flex gap-1">
            {(['run', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('btn btn-sm capitalize', tab === t ? 'btn-primary' : 'btn-secondary')}
              >
                {t === 'run' ? 'Studio' : `History (${history.length})`}
              </button>
            ))}
          </div>
        </div>

        {tab === 'run' && (
          <>
            {/* Prompt input */}
            <div className="card p-4">
              <label className="text-[12px] font-semibold text-[var(--color-text-heading)] mb-2 block">Evaluation Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Enter a prompt to evaluate across all configurations…"
                className="input resize-none mb-3"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[var(--color-text-muted)]">Quick:</span>
                {QUICK_PROMPTS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(q)}
                    className="badge badge-neutral text-[10.5px] cursor-pointer hover:bg-[var(--color-accent-subtle)] transition-colors truncate max-w-[220px]"
                    title={q}
                  >
                    {q.slice(0, 45)}…
                  </button>
                ))}
              </div>
            </div>

            {/* Config cards */}
            <div className="grid grid-cols-2 gap-4">
              {configs.map((c) => (
                <ConfigCard key={c.id} config={c} onChange={updateConfig} />
              ))}
            </div>

            {/* Run button */}
            <button
              onClick={runEval}
              disabled={!prompt.trim() || running}
              className="btn btn-primary w-full gap-2 py-3 text-[14px]"
            >
              {running ? <Loader2 size={16} className="animate-spin-slow" /> : <Play size={16} />}
              {running ? 'Evaluating…' : 'Run Evaluation'}
              {!running && <ArrowRight size={14} />}
            </button>

            {/* Results */}
            {results.length > 0 && (
              <div className="grid grid-cols-2 gap-4" style={{ minHeight: 400 }}>
                {results.map((r) => {
                  const cfg = configs.find((c) => c.id === r.configId)!;
                  return (
                    <ResultPanel
                      key={r.configId}
                      config={cfg}
                      result={r}
                      onScore={(s) => updateScore(r.configId, s)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div className="flex flex-col gap-3">
            {history.length === 0 ? (
              <div className="py-20 text-center">
                <FlaskConical size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--color-ai-purple)' }} />
                <p className="text-[13px] text-[var(--color-text-muted)]">No evaluations yet — run one in the Studio tab.</p>
              </div>
            ) : (
              history.map((run) => <HistoryRow key={run.id} run={run} />)
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
