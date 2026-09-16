# 🤖 AI-Powered Developer Platform

> A full-stack enterprise developer platform featuring a React-based UI, a real-time streaming AI assistant, and a FastAPI analytics backend.

[![Built with FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Built with React](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=flat&logo=react)](https://vitejs.dev)
[![Built with TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)

## What I Built

I designed and implemented a **full-stack enterprise developer platform UI** — comprising 13 React pages, a global AI overlay, and a new analytics API layer. 

### Frontend (React + Vite + TypeScript)

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
| **Data Catalog** | Tree browser with inline SQL editor and live mock data |
| **Collaboration Hub** | Slack-style channels, presence dots, emoji reactions |
| **AI Assistant Overlay** | `⌘J` global chat with real SSE streaming + tool-use cards |
| **Command Palette** | `⌘K` fuzzy navigation across all pages |

### Backend API (Python / FastAPI)

Added `server/routers/analytics.py` with 5 endpoints that read from the `executions` table — daily KPIs, timeseries, tool usage, paginated history, and notifications. 

### Design System
A comprehensive 600+ line CSS token system with dark/light mode, glassmorphism, Geist font, and Framer Motion micro-animations across all pages.

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
