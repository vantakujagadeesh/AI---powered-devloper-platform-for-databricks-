import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { UserProvider } from './contexts/UserContext';
import { ProjectsProvider } from './contexts/ProjectsContext';
import { useTheme } from './contexts/ThemeContext';
import CommandPalette from './components/CommandPalette';
import AIAssistantOverlay from './components/AIAssistantOverlay';

// Existing pages
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import DocPage from './pages/DocPage';

// Phase 1 advanced pages (lazy-loaded)
const DashboardPage       = lazy(() => import('./pages/DashboardPage'));
const AnalyticsPage       = lazy(() => import('./pages/AnalyticsPage'));
const IDEPage             = lazy(() => import('./pages/IDEPage'));
const PipelineBuilderPage = lazy(() => import('./pages/PipelineBuilderPage'));
const JobsPage            = lazy(() => import('./pages/JobsPage'));
const ClustersPage        = lazy(() => import('./pages/ClustersPage'));
const MarketplacePage     = lazy(() => import('./pages/MarketplacePage'));
const HistoryPage         = lazy(() => import('./pages/HistoryPage'));
const SettingsPage        = lazy(() => import('./pages/SettingsPage'));
const AdminPage           = lazy(() => import('./pages/AdminPage'));

// Phase 2 MVP pages (lazy-loaded)
const EvaluationPage      = lazy(() => import('./pages/EvaluationPage'));
const CatalogPage         = lazy(() => import('./pages/CatalogPage'));
const CollaborationPage   = lazy(() => import('./pages/CollaborationPage'));

// Loading fallback — spinner centered
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div
        className="w-9 h-9 rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)]"
        style={{ animation: 'spin 0.7s linear infinite' }}
      />
      <p className="text-[13px] text-[var(--color-text-muted)]">Loading…</p>
    </div>
  );
}

function App() {
  const { resolvedTheme } = useTheme();

  return (
    <UserProvider>
      <ProjectsProvider>
        {/* Global overlays — always mounted regardless of route */}
        <CommandPalette />
        <AIAssistantOverlay />

        <div className="min-h-screen bg-[var(--color-canvas)]">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Existing core pages ── */}
              <Route path="/"                     element={<HomePage />} />
              <Route path="/doc"                  element={<DocPage />} />
              <Route path="/projects/:projectId"  element={<ProjectPage />} />

              {/* ── Phase 1 — Advanced pages ── */}
              <Route path="/dashboard"            element={<DashboardPage />} />
              <Route path="/analytics"            element={<AnalyticsPage />} />
              <Route path="/ide"                  element={<IDEPage />} />
              <Route path="/pipeline-builder"     element={<PipelineBuilderPage />} />
              <Route path="/jobs"                 element={<JobsPage />} />
              <Route path="/clusters"             element={<ClustersPage />} />
              <Route path="/marketplace"          element={<MarketplacePage />} />
              <Route path="/history"              element={<HistoryPage />} />
              <Route path="/settings"             element={<SettingsPage />} />
              <Route path="/admin"                element={<AdminPage />} />

              {/* ── Phase 2 — MVP features ── */}
              <Route path="/evaluation"           element={<EvaluationPage />} />
              <Route path="/catalog"              element={<CatalogPage />} />
              <Route path="/collaboration"        element={<CollaborationPage />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <Toaster
            position="bottom-right"
            theme={resolvedTheme}
            toastOptions={{
              style: {
                background: 'var(--color-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
              },
            }}
          />
        </div>
      </ProjectsProvider>
    </UserProvider>
  );
}

export default App;
