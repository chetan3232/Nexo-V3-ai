# NEXO V3 — The Autonomous AI Coding & Design Workspace

**Nexo V3** is a futuristic, next-generation AI companion IDE. Combining the power of **VS Code, Cursor, Windsurf, Devin, Replit, and Lovable**, Nexo V3 provides a unified, glassmorphic visual development cockpit supporting local AI, multi-agent orchestration, sandbox runtimes, one-click cloud deployments, and live full-stack app generation.

---

## ⚡ Master Phase-Wise Roadmap & Milestones

Nexo V3 is structured around a stable, modular, progressive development pipeline, securing stable foundations before piling on complex autonomous layers.

```
# 🧠 NEXO V3 — MASTER TASK ROADMAP (PHASE WISE)

> Production-grade AI-native IDE inspired by VS Code, Cursor, Windsurf, Devin, and Replit.

---

# 🎯 PRODUCT VISION

NEXO V3 is an Electron-based AI-powered IDE with:
- AI coding
- multi-agent orchestration
- autonomous coding
- local LLM support
- deployment engine
- runtime sandbox
- futuristic but clean developer experience

-

---

## 🏗️ Detailed Functional Roadmaps

### 🧠 Phase 2 — AI Foundation (Current Milestone)
*   **AI Chat Panel:** Streaming SSE tokens, markdown rendering, syntax code blocks.
*   **Context Engine:** AI parses open tabs, selection ranges, active terminal logs, and explorer directories automatically.
*   **Inline AI (Cmd+K):** Floating input overlay overlaying Monaco editor cursor, streaming inline code changes directly with full undo-redo stack compatibility.
*   **Multi-Model Router:** Fast tasks auto-routed to fast local models; complex refactorings routed to flagship coding models (e.g. Qwen3 Coder 480B).

### 🤖 Phase 3 — Agent System (Up Next)
*   **Rounded discussion roundtable:** Live debating stream between Planner, Coder, Debugger, UX, and Deployer agents.
*   **Task Queue & Activity Feed:** Track asynchronous background actions live on an animated SVG timeline graph.

### 🧠 Phase 4 — Semantic Memory Engine
*   **Embeddings Vault:** Vector database (Supabase pgvector) storing cos-similarity embeddings of your code repository to inject pinpoint contextual chunks.

### ⚡ Phase 5 — Autonomous Coding
*   **Goal Planner:** Converts broad ideas into step-wise filesystem plans.
*   **Self-Healing compiler loops:** Captures linter and compile stack errors, feeds them back to the AI loop, and overwrites broken syntax automatically!

### 🌐 Phase 6 & Phase 7 — Runtimes & Cloud Deployments
*   **Docker Sandboxing:** Isolated Node execution contexts to test packages securely.
*   **One-Click Cloud Pipeline:** Single-click Vercel, Netlify, Railway, or Cloudflare deployments with live log visualizers.

---

## 🏗️ Folder Architecture

```txt
nexo-v3/
 ├── server/
 │    ├── database/     # Supabase schemas & Postgres connections
 │    ├── routes/       # Express API controllers (auth, files, projects, memories)
 │    ├── ai/           # AI Prompts & token streaming configurations
 │    ├── agents/       # Autonomous task loop plan orchestrators
 │    ├── memory/       # Cosine-similarity vector math calculations
 │    ├── runtime/      # Docker container isolated runtimes
 │    ├── terminal/     # PowerShell/Shell PTY runners
 │    ├── deploy/       # Vercel, Netlify, Cloudflare Wrangler builders
 │    ├── websocket/    # Real-time multiplexing stream gateway
 │    └── index.js      # Main Express application bootloader
 └── src/
      ├── app/          # State providers
      ├── components/   # Modular layout items
      ├── editor/       # Monaco Editor tabs and workspace Canvas
      ├── store/        # Zustand states (FileSystem, Editor, Chat, Terminal)
      ├── services/     # Backend REST & WebSocket connection clients
      └── main.tsx      # React entrypoint
```

---

## 🛠️ Technology Stack

*   **Frontend:** React (v19), TypeScript, Vite, TailwindCSS (v4), Framer Motion, Zustand, Monaco Editor, React Resizable Panels, Lucide Icons, `xterm.js`.
*   **Backend:** Node.js (ESM), Express, `ws` WebSockets, `dotenv`.
*   **Database:** Supabase Platform (PostgreSQL, pgvector, Auth, real-time channels).
*   **Execution layer:** Native subprocess execution, Docker containerization.

---

## 🚀 Installation & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/chetan3232/Nexo-V3-ai.git
cd Nexo-V3-ai
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Nexo Server Port (Default: 8787)
NEXO_API_PORT=8787

# Supabase Configurations (Boots in Mock mode if undefined)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NVIDIA NIM API Keys
NVIDIA_API_KEY=your_nvidia_api_key
VITE_NVIDIA_API_KEY=your_nvidia_api_key
```

### 3. Run Development Environment

Start the **Frontend Client UI** (listens on `http://localhost:3000`):
```bash
npm run dev
```

Start the **Backend API & WebSockets Server** (listens on `http://localhost:8787`):
```bash
npm run dev:server
```
