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

---

# 🏗️ PHASE 1 — CORE IDE FOUNDATION

## Goal
Build stable VS Code-style IDE foundation.

---

## TASKS

### 1. Project Setup
- [x] Setup Electron + Vite + React + TypeScript
- [x] Configure TailwindCSS
- [x] Setup Zustand store
- [x] Setup folder architecture
- [x] Configure aliases

---

### 2. Layout System
- [x] Create Activity Bar
- [x] Create Sidebar
- [x] Create Editor Layout
- [x] Create Bottom Panel
- [x] Create Status Bar
- [x] Create Right AI Panel
- [x] Add resizable layout system

---

### 3. Monaco Editor
- [x] Install Monaco Editor
- [x] Setup syntax highlighting
- [x] Add themes
- [x] Add tabs system
- [x] Add split editor
- [x] Add minimap toggle
- [x] Add auto-save (debounced 1000ms triggers)
- [x] Add editor settings (persisted configuration dropdown overlays)

---

### 4. File Explorer
- [x] Build folder tree
- [x] Add create file/folder
- [x] Add rename
- [x] Add delete
- [x] Add drag-drop
- [x] Add context menu (premium absolute glassmorphic right-click options)
- [x] Add search files (live filter tree auto-expands active matches)

---

### 5. Terminal System
- [x] Install xterm.js
- [x] Setup node-pty (implemented using portable, zero-compile concurrent child_process shells)
- [x] Create terminal tabs
- [x] Add split terminal (concurrent interactive dual flex panels layout)
- [x] Add shell sessions
- [x] Add terminal persistence (keeps scrolling logs intact in memory)

---

### 6. Workspace System
- [x] Open folder (Electron native folder open dialog + server route updates)
- [x] Recent projects (automatically saved local history dropdown selectors)
- [x] Save workspace state (persists opened files and active viewport paths)
- [x] Restore sessions (restores canvas layouts seamlessly on boot reload)
- [x] Persistent tabs (keeps active monaco models in local states)

---

### 7. UI/UX Polish
- [x] Add command palette
- [x] Add smooth animations
- [x] Add keyboard shortcuts
- [x] Add notifications (smooth, high-end glassmorphic toast notification stack)
- [x] Add custom title bar
- [x] Add dark theme system

---

# 🧠 PHASE 2 — AI FOUNDATION

## Goal
Integrate production-grade AI assistant.

---

## TASKS

### 1. AI Chat Panel
- [x] Streaming chat UI
- [x] Markdown rendering
- [x] Code blocks
- [x] Syntax highlighting
- [x] Chat history (Zustand persisted)
- [x] Token counter (approximated context word counting active)

---

### 2. AI Providers
- [x] OpenAI integration
- [x] Claude integration
- [x] Gemini integration
- [x] OpenRouter integration
- [x] Ollama integration
- [x] NVIDIA integration (55 flagship NIM models active!)
- [x] DeepSeek integration
- [x] AI Model Router (automatic routing: cheap tasks -> local model, coding -> Claude, reasoning -> Gemini)

---

### 3. AI Context Engine
- [x] Inject open files
- [x] Inject selected code
- [x] Inject terminal logs (recent terminal subprocess stream history capture)
- [x] Inject errors (live Monaco editor compilation markers and warning lists)
- [x] Inject project tree (flat folder tree recursive path descriptors)

---

### 4. Inline AI
- [x] Ghost text (ultra-fast debounced gray continuation recommendations)
- [x] Autocomplete (Tab-to-accept inline completions triggers)
- [x] Explain selection
- [x] Refactor code
- [x] Fix errors
- [x] Generate component

---

### 5. AI Actions
- [x] Right-click AI menu (native Explain, Optimize, and Document code selections)
- [ ] AI commands
- [ ] AI shortcuts
- [ ] Context actions

---

# 🤖 PHASE 3 — AGENT SYSTEM

## Goal
Multi-agent orchestration system.

---

## TASKS

### 1. Planner Agent
- [ ] Task breakdown
- [ ] Execution planning
- [ ] Dependency planning

---

### 2. Coding Agent
- [ ] Generate files
- [ ] Modify files
- [ ] Create structure

---

### 3. Debug Agent
- [ ] Analyze errors
- [ ] Suggest fixes
- [ ] Retry execution

---

### 4. UI Agent
- [ ] Generate UI
- [ ] Improve layouts
- [ ] Optimize responsiveness

---

### 5. Refactor Agent
- [ ] Optimize code
- [ ] Remove duplication
- [ ] Improve structure

---

### 6. Agent Orchestrator
- [ ] Multi-agent execution
- [ ] Task queue
- [ ] Agent communication
- [ ] Parallel processing

---

### 7. Agent UI
- [ ] Agent activity feed
- [ ] Live thinking UI
- [ ] Agent logs
- [ ] Agent timeline

---

# 🧠 PHASE 4 — MEMORY ENGINE

## Goal
Persistent intelligent memory system.

---

## TASKS

### 1. Conversation Memory
- [ ] Store chat history
- [ ] Context retrieval
- [ ] Smart summarization

---

### 2. Project Memory
- [ ] Store architecture
- [ ] Store patterns
- [ ] Store dependencies

---

### 3. Code Memory
- [ ] Store snippets
- [ ] Store fixes
- [ ] Store reusable logic

---

### 4. Vector Database
- [ ] Setup pgvector
- [ ] Setup embeddings
- [ ] Semantic retrieval

---

### 5. Smart Retrieval
- [ ] Relevant context injection
- [ ] File ranking
- [ ] Smart search

---

# ⚡ PHASE 5 — AUTONOMOUS CODING

## Goal
AI independently builds projects.

---

## TASKS

### 1. Planning Engine
- [ ] Task graph generation
- [ ] Dependency analysis
- [ ] File planning

---

### 2. Autonomous Generation
- [ ] Create files
- [ ] Install packages
- [ ] Configure environment

---

### 3. Error Recovery
- [ ] Detect failures
- [ ] Retry execution
- [ ] Auto debugging

---

### 4. Testing System
- [ ] Run tests
- [ ] Analyze failures
- [ ] Fix issues

---

### 5. Live Workflow UI
- [ ] Planning view
- [ ] Coding view
- [ ] Testing view
- [ ] Deployment view

---

# 🌐 PHASE 6 — RUNTIME SYSTEM

## Goal
Secure runtime and execution engine.

---

## TASKS

### 1. Sandbox Runtime
- [ ] Docker containers
- [ ] Process isolation
- [ ] Security restrictions

---

### 2. Live Preview
- [ ] Browser preview
- [ ] Mobile preview
- [ ] Hot reload

---

### 3. Runtime Manager
- [ ] Process manager
- [ ] Restart processes
- [ ] Kill processes

---

### 4. Multi Runtime
- [ ] Node runtime
- [ ] Python runtime
- [ ] React runtime
- [ ] Next.js runtime

---

# 🚀 PHASE 7 — DEPLOYMENT ENGINE

## Goal
One-click deployment system.

---

## TASKS

### 1. Providers
- [ ] Vercel integration
- [ ] Netlify integration
- [ ] Railway integration
- [ ] Cloudflare integration

---

### 2. Deployment Engine
- [ ] Generate build config
- [ ] Generate env files
- [ ] Generate deployment scripts

---

### 3. Deployment UI
- [ ] Deployment logs
- [ ] Deployment history
- [ ] Deployment status

---

# 📱 PHASE 8 — APP EXPORT SYSTEM

## Goal
Export projects as apps.

---

## TASKS

### 1. Desktop Export
- [ ] Electron packaging
- [ ] Tauri support

---

### 2. Mobile Export
- [ ] APK builder
- [ ] Capacitor integration
- [ ] Android Studio export

---

### 3. PWA Export
- [ ] Service worker
- [ ] Offline support
- [ ] Installable app

---

# 🔐 PHASE 9 — AUTH & CLOUD

## Goal
Authentication and sync system.

---

## TASKS

### 1. Authentication
- [ ] Google auth
- [ ] GitHub auth
- [ ] Email auth

---

### 2. Cloud Sync
- [ ] Project sync
- [ ] Workspace sync
- [ ] AI memory sync

---

### 3. Team Collaboration
- [ ] Realtime collaboration
- [ ] Shared workspace
- [ ] Shared AI sessions

---

# 📊 PHASE 10 — ANALYTICS & MONITORING

## Goal
Performance and analytics.

---

## TASKS

### 1. Monitoring
- [ ] RAM usage
- [ ] CPU usage
- [ ] Process monitoring

---

### 2. AI Analytics
- [ ] Token tracking
- [ ] Model usage
- [ ] AI performance

---

### 3. Error Tracking
- [ ] Crash reporting
- [ ] Logs
- [ ] Diagnostics

---

# 🎨 DESIGN PRINCIPLES

- Clean minimal UI
- VS Code inspired
- Professional spacing
- Fast interactions
- Smooth subtle animations
- Minimal glow effects
- Premium developer experience

---

# 🎨 THEME

## Colors

Background:
#0d1117

Sidebar:
#111827

Border:
#1f2937

Accent:
#3b82f6

Text:
#e5e7eb

Muted:
#9ca3af

---

# 🔠 TYPOGRAPHY

UI Font:
Inter

Code Font:
JetBrains Mono

---

# ⚙️ TECH STACK

## Frontend
- React
- TypeScript
- TailwindCSS
- Framer Motion
- Zustand

---

## IDE
- Monaco Editor
- xterm.js

---

## Backend
- Electron
- Node.js
- Express/Fastify
- WebSocket

---

## AI
- OpenAI
- Claude
- Gemini
- Ollama
- OpenRouter
- NVIDIA
- DeepSeek

---

## Database
- Supabase
- PostgreSQL
- pgvector

---

# 🧩 FINAL FOLDER STRUCTURE

```txt
nexo-v3/
├── electron/
├── backend/
├── src/
│
├── ai/
├── agents/
├── analytics/
├── auth/
├── cloud/
├── deploy/
├── editor/
├── explorer/
├── git/
├── memory/
├── runtime/
├── terminal/
├── workspace/
│
├── components/
├── hooks/
├── layouts/
├── pages/
├── services/
├── store/
└── styles/
```

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
