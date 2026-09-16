import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Star, Download, Eye, Tag,
  CheckCircle2, Code2, Database, Brain, Layers, Zap,
  GitBranch, X, ChevronRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';

interface Skill {
  name: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  stars: number;
  installed: boolean;
  author: string;
  content: string;
}

const CATEGORIES = ['All', 'SQL', 'ML/AI', 'Unity Catalog', 'Jobs', 'Pipelines', 'Serving', 'Security'];

const MOCK_SKILLS: Skill[] = [
  { name: 'databricks-sql-expert', title: 'SQL Expert', description: 'Advanced SQL patterns, query optimization, and Delta Lake best practices for Databricks SQL.', category: 'SQL', tags: ['SQL', 'Delta', 'Performance'], stars: 142, installed: true, author: 'Databricks', content: '# SQL Expert\n\nThis skill teaches advanced SQL patterns...\n\n## Key capabilities:\n- Query optimization with EXPLAIN\n- Delta Lake merge patterns\n- Streaming SQL\n- Z-ORDER clustering' },
  { name: 'databricks-ml-pipelines', title: 'ML Pipelines', description: 'Build end-to-end machine learning pipelines with MLflow, Feature Store, and Model Serving.', category: 'ML/AI', tags: ['MLflow', 'Feature Store', 'AutoML'], stars: 98, installed: false, author: 'Databricks', content: '# ML Pipelines\n\nComprehensive ML pipeline patterns...' },
  { name: 'unity-catalog-governance', title: 'Unity Catalog Governance', description: 'Data governance, access control, column masking, row filtering, and lineage tracking.', category: 'Unity Catalog', tags: ['Governance', 'RBAC', 'Lineage'], stars: 76, installed: true, author: 'Databricks', content: '# Unity Catalog Governance\n\nEnterprise data governance...' },
  { name: 'databricks-dlt-patterns', title: 'DLT Patterns', description: 'Declarative pipeline patterns with Delta Live Tables, streaming, CDC, and SCD type-2.', category: 'Pipelines', tags: ['DLT', 'CDC', 'Streaming'], stars: 134, installed: false, author: 'Databricks', content: '# DLT Patterns\n\nDelta Live Tables best practices...' },
  { name: 'vector-search-rag', title: 'Vector Search & RAG', description: 'Build retrieval-augmented generation pipelines with Databricks Vector Search and DBRX.', category: 'ML/AI', tags: ['RAG', 'Vector Search', 'LLM'], stars: 210, installed: false, author: 'community', content: '# Vector Search & RAG\n\nRAG pipeline implementation...' },
  { name: 'databricks-jobs-advanced', title: 'Advanced Jobs', description: 'Complex multi-task job DAGs, repair runs, conditional tasks, and job performance tuning.', category: 'Jobs', tags: ['Jobs', 'DAG', 'Workflows'], stars: 64, installed: false, author: 'Databricks', content: '# Advanced Jobs\n\nJob orchestration patterns...' },
  { name: 'model-serving-patterns', title: 'Model Serving', description: 'Deploy, A/B test, and monitor ML models on Databricks Model Serving endpoints.', category: 'Serving', tags: ['Serving', 'A/B Testing', 'Monitoring'], stars: 88, installed: false, author: 'Databricks', content: '# Model Serving\n\nModel deployment patterns...' },
  { name: 'databricks-security', title: 'Security & Compliance', description: 'Network isolation, credential secrets, audit logging, and compliance automation.', category: 'Security', tags: ['Security', 'Secrets', 'Compliance'], stars: 52, installed: false, author: 'community', content: '# Security & Compliance\n\nSecurity hardening guide...' },
];

const CAT_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  SQL: Database, 'ML/AI': Brain, 'Unity Catalog': Layers, Jobs: Zap, Pipelines: GitBranch, Serving: Code2, Security: Tag, All: ShoppingBag,
};

function SkillCard({ skill, onPreview, onInstall }: { skill: Skill; onPreview: () => void; onInstall: () => void }) {
  const CatIcon = CAT_ICONS[skill.category] ?? Code2;
  return (
    <motion.div
      className="card p-4 cursor-pointer card-interactive"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-ai-purple-subtle)] flex items-center justify-center flex-shrink-0">
          <CatIcon size={16} style={{ color: 'var(--color-ai-purple)' }} />
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
          <Star size={11} fill="var(--color-amber)" stroke="var(--color-amber)" />
          {skill.stars}
        </div>
      </div>
      <p className="text-[13px] font-semibold text-[var(--color-text-heading)] mb-1">{skill.title}</p>
      <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-3 line-clamp-2">{skill.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {skill.tags.map((tag) => (
          <span key={tag} className="badge badge-neutral text-[10px]">{tag}</span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[var(--color-text-muted)]">by {skill.author}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={onPreview} className="btn btn-ghost btn-sm gap-1">
            <Eye size={11} /> Preview
          </button>
          {skill.installed ? (
            <span className="badge badge-success gap-1"><CheckCircle2 size={10} /> Installed</span>
          ) : (
            <button onClick={onInstall} className="btn btn-primary btn-sm gap-1">
              <Download size={11} /> Install
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);

  const filtered = skills.filter((s) =>
    (category === 'All' || s.category === category) &&
    (s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleInstall = (name: string) => {
    setSkills((prev) => prev.map((s) => s.name === name ? { ...s, installed: true } : s));
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-heading)]">Skill Marketplace</h2>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Browse and install Databricks agent skills</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">{skills.filter((s) => s.installed).length} Installed</span>
            <span className="badge badge-neutral">{skills.length} Total</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills…" className="input pl-9" />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => {
            const CatIcon = CAT_ICONS[cat] ?? Code2;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn('btn btn-sm gap-1.5', category === cat ? 'btn-primary' : 'btn-secondary')}
              >
                <CatIcon size={12} />
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((skill) => (
            <SkillCard
              key={skill.name}
              skill={skill}
              onPreview={() => setPreviewSkill(skill)}
              onInstall={() => handleInstall(skill.name)}
            />
          ))}
        </div>

        {/* Preview modal */}
        <AnimatePresence>
          {previewSkill && (
            <div className="palette-overlay" onClick={() => setPreviewSkill(null)}>
              <motion.div
                className="bg-[var(--color-elevated)] rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] shadow-[var(--shadow-xl)] w-[min(680px,calc(100vw-32px))] max-h-[80vh] overflow-hidden flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: -16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -16 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[var(--color-text-heading)]">{previewSkill.title}</h3>
                    <p className="text-[12px] text-[var(--color-text-muted)]">by {previewSkill.author} · {previewSkill.stars} stars</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!previewSkill.installed && (
                      <button onClick={() => { handleInstall(previewSkill.name); setPreviewSkill(null); }} className="btn btn-primary btn-sm gap-1">
                        <Download size={11} /> Install
                      </button>
                    )}
                    <button onClick={() => setPreviewSkill(null)} className="btn btn-ghost btn-sm"><X size={14} /></button>
                  </div>
                </div>
                <div className="overflow-y-auto p-5">
                  <pre className="prose-chat text-[12.5px] whitespace-pre-wrap">{previewSkill.content}</pre>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
