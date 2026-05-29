# NEXO V3 — The Autonomous AI Coding & Design Workspace

**Nexo V3** is a futuristic, next-generation AI companion IDE. Inspired by VS Code, Cursor, Windsurf, Devin, and Lovable, Nexo V3 provides a unified, glassmorphic visual development cockpit supporting local AI orchestration, multi-agent debates, sandboxed execution runtimes, and live visual diff code approvals.

---

## 🎯 Product Vision & Core Architecture
Nexo V3 is structured around a stable, modular, progressive development pipeline, combining state-of-the-art developer UX with real-time AI agents:

*   **Planner Agent:** Converts broad ideas into step-wise filesystem plans before writing any code.
*   **Context Engine:** Injects open tabs, cursor selection ranges, active terminal logs, compiler errors, and workspace directory structures directly into LLM prompts.
*   **Tool Calling System:** Permits agents to read/write files, create folders, execute terminal commands, and query vector memories autonomously.
*   **Visual Diff Approvals (Antigravity Mode):** Stages proposed code changes side-by-side using Monaco Diff Editors, allowing developers to explicitly `Accept` or `Reject` changes before writing to disk.
*   **Live AI Timeline:** Logs chronological workspace modifications, compiler checkouts, and runtime logs directly in the sidebar panel.

---

## 🏗️ Folder Architecture

```txt
nexo-v3/
 ├── backend/           # Core API & Gateway Server
 │    ├── agents/       # Autonomous task loop plan orchestrators
 │    ├── ai/           # LLM Prompts & token streaming configurations
 │    ├── database/     # Supabase SQL schemas & PostgreSQL connection setups
 │    ├── deploy/       # Vercel, Netlify, Cloudflare Wrangler builders
 │    ├── memory/       # Cosine-similarity vector math calculations
 │    ├── routes/       # Express API controllers (auth, files, projects, memories)
 │    ├── runtime/      # Docker container isolated runtimes
 │    ├── terminal/     # PowerShell/Shell PTY runners
 │    ├── websocket/    # Real-time multiplexing stream gateway
 │    └── index.js      # Main Express application bootloader
 └── src/               # Client React Application
      ├── agents/       # Frontend planning scripts
      ├── ai/           # Context engines & tool execution clients
      ├── components/   # Modular layout items & UI widgets
      ├── editor/       # Monaco Editor tabs and workspace canvas items
      ├── services/     # Backend REST & WebSocket connection clients
      ├── store/        # Zustand state stores (FileSystem, Editor, Chat, Timeline)
      ├── styles/       # Global CSS & glassmorphic aesthetics config
      ├── workspace/    # Primary IDE workspace layout
      └── main.tsx      # React web app entrypoint
```

---

## 🛠️ Technology Stack

*   **Frontend:** React (v19), TypeScript, Vite, TailwindCSS (v4), Framer Motion, Zustand, Monaco Editor, React Resizable Panels, Lucide Icons, `xterm.js`.
*   **Backend:** Node.js (ESM), Express, `ws` WebSockets, `dotenv`.
*   **Database:** Supabase Platform (PostgreSQL, pgvector, Auth, real-time channels).
*   **Execution layer:** Native subprocess execution, Docker containerization.

---

## 🚀 Installation & Run Guide

### 1. Prerequisites & Environment Configuration
Clone the repository and install npm packages:
```bash
git clone https://github.com/chetan3232/Nexo-V3-ai.git
cd Nexo-V3-ai
npm install
```

Create a `.env` file in the root directory:
```env
# Nexo Server Port (Default: 8787)
NEXO_API_PORT=8787

# Supabase Configurations (Boots in mock mode if undefined)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NVIDIA NIM API Keys (Required for AI actions)
NVIDIA_API_KEY=your_nvidia_api_key
VITE_NVIDIA_API_KEY=your_nvidia_api_key
```

---

### 2. How to Run Nexo V3

You can launch Nexo V3 across multiple targets: Web (Standard browser layout) or Desktop (Electron / Tauri wrapper layers).

#### Option A: Running as a Web Application (Recommended for Dev)

1.  **Start the Backend API & WebSockets Gateway Server** (runs on port `8787`):
    ```bash
    npm run dev:server
    ```
2.  **Start the Frontend Client UI** (runs on port `3000` via Vite):
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) in your web browser.

#### Option B: Running as an Electron Desktop Application

1.  **Ensure Vite Dev Server is running** on port `3000`:
    ```bash
    npm run dev
    ```
2.  **Ensure Backend Gateway Server is running** on port `8787`:
    ```bash
    npm run dev:server
    ```
3.  **Boot the Electron window** (automatically bridges OS filesystem & native terminal integrations):
    ```bash
    npm run desktop:dev
    ```

#### Option C: Running as a Tauri Application
If you prefer light rust-compiled desktop window binaries:
1.  Make sure cargo/Rust compiler tools are installed.
2.  Boot dev target:
    ```bash
    npm run tauri:dev
    ```

---

## 🛠️ Verification & Verification Commands
Before submitting PRs or deploying staging builds, verify TypeScript typing compiles successfully:
```bash
npm run build
```
