# AI-Powered Developer Platform UI — Built on Databricks AI Dev Kit

[![React](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=flat&logo=react)](https://vitejs.dev)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat)](./LICENSE.md)

---

> **Attribution notice:** This repository is based on the open-source
> [Databricks AI Dev Kit](https://github.com/databricks-solutions/ai-dev-kit)
> by Databricks engineering. The original backend (FastAPI server, Claude Code agent
> integration, Lakebase PostgreSQL persistence, `databricks-tools-core`) is
> Databricks' work and remains unchanged. What I built on top is described below.

---

## What I Built On Top

Starting from the Databricks AI Dev Kit's backend as a base, I designed and implemented
a full **enterprise developer platform UI** — 13 React pages, a global AI overlay,
and a new analytics API layer — none of which existed in the original repository.

### New Frontend (React + Vite + TypeScript)

| Page / Feature | Description |
|---------------|-------------|
| **Dashboard** | KPI cards, recharts area + bar charts wired to real execution data |
| **Analytics** | Execution trends, tool-usage pie, duration histogram |
| **IDE** | Monaco editor with resizable panels and file tree |
| **Pipeline Builder** | Drag-and-drop ReactFlow canvas with YAML export |
| **Jobs** | Gantt-style timeline with searchable table |
| **Clusters** | Expandable cards with sparklines and cost estimates |
| **Marketplace** | Skill grid with search, install flow, and preview modal |
| **History** | Expandable execution rows with step replay |
| **Settings** | 4-tab config panel with animated toggles |
| **Admin** | User/role management, audit log, system health |
| **Evaluation Studio** | Side-by-side A/B model comparison with 5-star scoring |
| **Data Catalog** | Unity Catalog tree browser with inline SQL editor |
| **Collaboration Hub** | Slack-style channels, presence dots, emoji reactions |
| **AI Assistant Overlay** | `⌘J` global chat with real SSE streaming + tool-use cards |
| **Command Palette** | `⌘K` fuzzy navigation across all pages |

### New Backend (Python / FastAPI)

Added `server/routers/analytics.py` with 5 endpoints that read from the existing
`executions` table — daily KPIs, timeseries, tool usage, paginated history, and
notifications. All endpoints have graceful mock fallbacks when DB is not configured.

### Design System

A 606-line `globals.css` token system with dark/light mode, glassmorphism, Geist
font, 7 badge variants, and Framer Motion micro-animations across all pages.

---

## Tech Stack (additions only)

- **State:** Zustand stores (`appStore`, `editorStore`, `commandStore`)
- **Charts:** Recharts (area, bar, pie, histogram)
- **Canvas:** React Flow (pipeline builder)
- **Editor:** Monaco Editor (cloud IDE)
- **Animations:** Framer Motion
- **Icons:** Lucide React

---

## Running Locally

```bash
# Backend
cd databricks-builder-app
pip install -r requirements.txt
python -m uvicorn server.app:app --reload
# → http://localhost:8000

# Frontend
cd databricks-builder-app/client
npm install
npm run dev
# → http://localhost:3000
```

---

## Original Project

The underlying agent backend, MCP server, skills system, and Databricks tooling
are from the official **Databricks AI Dev Kit**. See the original documentation below.

---

---

<!-- ============================================================ -->
<!-- ORIGINAL DATABRICKS AI DEV KIT README BELOW (UNMODIFIED)    -->
<!-- ============================================================ -->
