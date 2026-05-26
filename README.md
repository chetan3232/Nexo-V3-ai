# NEXO V3 — The Autonomous AI Coding & Design Workspace

**Nexo V3** is a futuristic, next-generation AI companion IDE. Combining the power of **VS Code, Cursor, Windsurf, Devin, Replit, Bolt, and Lovable**, Nexo V3 provides a unified, glassmorphic visual development cockpit supporting local AI, multi-agent orchestration, docker-sandbox executions, one-click deployments, and live full-stack app generation.

---

## ⚡ Key Highlights

### 1. AI Visual Builder & Netflix Sandbox Canvas
*   **Speech-to-Code Dictation:** Dictate design concepts hands-free with active **Web Speech API** dictation.
*   **High-Fidelity Sandbox Canvas:** Prompts like *"make netflix clone"* assemble structural React modules in the background, launching a premium interactive Netflix canvas featuring:
    *   *Profile Switcher:* Interactive zoom selections when loading user accounts.
    *   *Hero description sliders:* Styled with custom action badges and volume triggers.
    *   *Horizontal movie lists:* Hover-zoom collection grids categorized by category.
    *   *Live Search matching:* Filter collection tables immediately using the live header input.
    *   *Simulated Video Player:* Full-screen overlay playing video mock renders with elapsed timers, progress, volume control and active exit.

### 2. Autonomous Multi-Agent Roundtable (AI Team Mode)
*   Launches live discussions between 4 specialized AI agents (UX Designer 🎨, Principal Architect ⚙️, Database Dev 💾, and Lead Programmer 🚀) debating design layouts and code changes in real-time.

### 3. Time Travel Version Control
*   Maintains sequential history rollback markers (`V1` to `V5`), detailing lines modified, and providing instant workspace reverts.

### 4. Smart AI Debugger Console
*   Captures active compilation error stack traces, replicates conditions inside isolated container reproduction tests, and applies safe auto-fix patches.

### 5. Secure Sandbox Container Runtimes
*   Detects if Docker daemon is active and executes shell scripts in isolated environments (`node:18-alpine` containers) with CPU and memory caps. Includes a safe local subprocess execution fallback.

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
      ├── store/        # Zustand application states (FileSystem, Editor, Chat)
      ├── services/     # Backend REST & WebSocket connection clients
      └── main.tsx      # React entrypoint
```

---

## 🛠️ Technology Stack

*   **Frontend:** React (v19), TypeScript, Vite, TailwindCSS (v4), Framer Motion, Zustand, Monaco Editor, React Resizable Panels, Lucide Icons.
*   **Backend:** Node.js (ESM), Express, `ws` WebSocket library.
*   **Database & Auth:** Supabase Platform (PostgreSQL, Auth, real-time channels).
*   **Execution layer:** Docker Container Sandbox daemon with a local isolated subprocess fallback.

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

---

## 🔐 Database Schema & Migrations

The Postgres migrations schema is defined in [supabase.schema.sql](file:///d:/Chetan/Nexo-V3-ai/server/database/supabase.schema.sql). Simply run it inside the Supabase SQL editor to create the following tables:
*   `users`: Auth identity & user metadata.
*   `projects`: User workspace descriptors.
*   `files`: Versioned, synchronized workspace files.
*   `messages`: Persistent chat dialog logs.
*   `deployments`: Target pipeline histories.
*   `memories`: pgvector-enabled semantic knowledge bases.
*   `agents`: Active goal task graphs.
*   `logs`: Consolidated logging stream logs.
