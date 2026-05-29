# 🚀 NEXO V3 — Phase 2 Implementation Plan
### *"Another AI IDE" → New Category Product*

> **Mission**: NEXO doesn't just write code. It understands your project, remembers every decision, acts like your CTO, and can build while you sleep.

---

## ✅ Phase 1 — Already Built

| Feature | Status |
|---|---|
| AI Project Brain (store + scanner + panel) | ✅ Done |
| CTO Mode (report card + toggle) | ✅ Done |
| Dream Mode (autonomous build + self-heal) | ✅ Done |
| Chat persistence + branching | ✅ Done |
| Agent Roundtable (simulated) | ✅ Done |
| Memory Engine | ✅ Done |

---

## 🗺️ Feature 1 — Visual Architecture Map

> **Highest Priority. No IDE has this. Pure differentiation.**

### What It Does
Interactive dependency graph of the entire project. Click any node → opens file in editor. Shows modules, components, routes, APIs as connected visual nodes.

### Architecture Flow
```
Brain Scan Output
      ↓
Parse import statements per file
      ↓
Build: nodes (files) + edges (imports)
      ↓
Render: interactive SVG graph
      ↓
Filters: all | components | stores | routes | APIs
Click node → openFile(path)
```

### New Store — `src/store/useArchMapStore.ts`

```ts
type ArchNode = {
  id: string
  path: string
  label: string
  type: 'component' | 'store' | 'service' | 'route' | 'api' | 'page' | 'hook'
  x?: number
  y?: number
  description?: string
}

type ArchEdge = {
  from: string
  to: string
  type: 'import' | 'uses' | 'calls'
}

type ArchMapState = {
  nodes: ArchNode[]
  edges: ArchEdge[]
  selectedNode: string | null
  filterType: 'all' | 'component' | 'store' | 'service' | 'route' | 'api'
  isBuilding: boolean
  buildMap: () => Promise<void>
  selectNode: (id: string | null) => void
  setFilter: (type: ArchMapState['filterType']) => void
}
```

### New Component — `src/editor/components/ArchitectureMapPanel.tsx`

**UI Elements:**
- Animated SVG canvas with positioned + colored nodes
- Color-coded by type:
  - 🔵 Components = blue
  - 🟠 Stores = orange
  - 🟢 Routes = green
  - 🟣 APIs = purple
  - 🔷 Hooks = teal
- Directional arrows between connected nodes
- Filter tabs at top (All / Components / Stores / Routes / APIs)
- Zoom + pan gesture support
- Click node → open file in editor tab
- Hover → mini tooltip with file summary from Brain
- "Build Map" trigger button with loading animation
- Legend panel bottom-right

### Files Changed

| File | Action |
|---|---|
| `src/store/useArchMapStore.ts` | **NEW** — graph state |
| `src/editor/components/ArchitectureMapPanel.tsx` | **NEW** — interactive graph UI |
| `backend/routes/archmap.js` | **NEW** — `/api/archmap/build` endpoint |
| `src/editor/components/AIAssistantPanel.tsx` | **MODIFY** — add `'archmap'` tab |

---

## ⚡ Feature 2 — Impact Analysis Engine

> **Cursor/GitHub Copilot don't have this. True CTO-level power.**

### What It Does
Before any AI file edit — or on-demand — analyzes cross-project impact. Shows affected files, risk level, and possible breakages BEFORE the change happens.

### Architecture Flow
```
User asks AI to change a file
          ↓
ImpactEngine.analyze(targetFile, changeDescription)
          ↓
Reads: Brain context + file exports + import graph
          ↓
LLM: "What files depend on this? What breaks?"
          ↓
Returns ImpactReport:
  - affected_files (with per-file risk)
  - overall_risk: low | medium | high | critical
  - breakage_scenarios
  - safe_refactor_steps
```

### New Store — `src/store/useImpactStore.ts`

```ts
type ImpactReport = {
  id: string
  targetFile: string
  changeDescription: string
  affectedFiles: {
    path: string
    reason: string
    risk: 'low' | 'medium' | 'high'
  }[]
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  breakageScenarios: string[]
  safeRefactorSteps: string[]
  timestamp: number
}

type ImpactState = {
  isAnalyzing: boolean
  report: ImpactReport | null
  analyzeImpact: (targetFile: string, changeDesc: string) => Promise<void>
  clearReport: () => void
}
```

### New Component — `src/editor/components/ImpactAnalysisPanel.tsx`

**UI Elements:**
- Risk badge (color-coded): 🟢 Low / 🟡 Medium / 🟠 High / 🔴 Critical
- Affected files list (each with per-file risk chip)
- Expandable "Breakage Scenarios" accordion
- Numbered "Safe Refactor Steps" guide
- "Analyze Active File" one-click trigger button
- Inline render inside AI chat when report is ready

### StatusBar Integration — `src/editor/components/StatusBar.tsx`

```
[ main ] [ 0 errors ] ──────── Impact: ● Safe | Health: 84% | TypeScript React ... 
```
- Clickable indicator showing active file's risk level
- Auto-updates when active file changes

### Files Changed

| File | Action |
|---|---|
| `src/store/useImpactStore.ts` | **NEW** — impact state + LLM analysis |
| `src/editor/components/ImpactAnalysisPanel.tsx` | **NEW** — impact report UI |
| `backend/routes/impact.js` | **NEW** — `/api/impact/analyze` endpoint |
| `src/editor/components/AIAssistantPanel.tsx` | **MODIFY** — Impact button in quick actions |
| `src/editor/components/StatusBar.tsx` | **MODIFY** — Risk level indicator |

---

## 🤖 Feature 3 — AI Learning Engine

### What It Does
NEXO learns from every coding session. Observes your preferences (frameworks, styling patterns, naming, libraries). Every subsequent AI generation automatically follows your style — no need to re-instruct.

### What Gets Learned
```
- Libraries chosen (e.g. "prefer lucide-react over heroicons")
- Naming patterns ("camelCase stores, PascalCase components")
- State management approach
- Import style (named vs default)
- Error handling patterns
- CSS approach (inline styles vs CSS modules vs utility classes)
- Component architecture patterns
```

### New Store — `src/store/useAiLearningStore.ts`

```ts
type CodingPreference = {
  category: 'framework' | 'state' | 'styling' | 'naming' | 'imports' | 'testing' | 'patterns'
  key: string
  value: string
  confidence: number // 0.0 - 1.0
  learnedAt: number
  source: 'explicit' | 'observed'
}

type AiLearningState = {
  preferences: CodingPreference[]
  isLearningEnabled: boolean
  learnFromCode: (code: string, filePath: string) => Promise<void>
  learnFromDecision: (context: string, choice: string) => void
  getStyleContext: () => string  // injected into every AI prompt
  forgetPreference: (key: string) => void
  resetAll: () => void
}
```

### New Component — `src/editor/components/AiLearningPanel.tsx`

**UI Elements:**
- **"Your Coding DNA"** header section
- Learned preferences as styled cards by category
- Confidence bar (0–100%) per preference
- Source badge: `📍 Observed` or `✏️ Explicit`
- "Forget" button per preference
- "Teach NEXO" — manual text input to add explicit preference
- Toggle to enable/disable learning per category

### Context Injection — `src/ai/contextInjection.ts`

```ts
// Add to formatContextForPrompt():
const styleContext = useAiLearningStore.getState().getStyleContext();
if (styleContext) {
  lines.push(`user_coding_style:\n${styleContext}`);
}
```

### Files Changed

| File | Action |
|---|---|
| `src/store/useAiLearningStore.ts` | **NEW** — learning + preferences state |
| `src/editor/components/AiLearningPanel.tsx` | **NEW** — coding DNA UI |
| `src/ai/contextInjection.ts` | **MODIFY** — inject style context |
| `src/store/useAgentStore.ts` | **MODIFY** — call `learnFromCode` after file write |

---

## 🏥 Feature 4 — Smart Project Health Dashboard

### What It Does
Continuously calculates a live "Project Health Score" (0–100). Breaks it down by 5 categories. Shows prioritized suggestions with auto-fix options.

### Score Formula
```
Health Score = weighted average:
  Security        (25%) — secrets, auth gaps, XSS
  Performance     (25%) — bundle size, re-renders, lazy loading
  Maintainability (25%) — unused code, long files, circular deps
  Testing         (15%) — test files ratio vs source files
  Documentation   (10%) — JSDoc, README completeness
```

### New Store — `src/store/useHealthStore.ts`

```ts
type HealthCategory = {
  name: 'security' | 'performance' | 'maintainability' | 'testing' | 'documentation'
  score: number
  weight: number
  icon: string
  details: string[]
  trend: 'up' | 'down' | 'stable'
}

type HealthSuggestion = {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  action: string
  autoFixable: boolean
}

type HealthState = {
  healthScore: number
  categories: HealthCategory[]
  suggestions: HealthSuggestion[]
  isCalculating: boolean
  lastCalculatedAt: number | null
  scoreHistory: { score: number; timestamp: number }[]
  calculateHealth: () => Promise<void>
  autoRefresh: boolean
  toggleAutoRefresh: () => void
}
```

### New Component — `src/editor/components/ProjectHealthPanel.tsx`

**UI Elements:**
- **Big animated score gauge** (speedometer-style, color 0–100)
  - 🟢 80–100 = Excellent
  - 🟡 60–79 = Good
  - 🟠 40–59 = Needs Work
  - 🔴 0–39 = Critical
- **5 mini category gauges** (Security, Performance, Maintainability, Testing, Docs)
- **Trend arrows** (↑ improving / ↓ declining)
- **Suggestions list** sorted by priority (high → medium → low)
- **"Auto-Fix" button** for fixable issues
- **History chart** — health score trend over time
- **"Recalculate" button**

### Files Changed

| File | Action |
|---|---|
| `src/store/useHealthStore.ts` | **NEW** — health calculation state |
| `src/editor/components/ProjectHealthPanel.tsx` | **NEW** — health dashboard UI |
| `backend/routes/health.js` | **NEW** — `/api/health/calculate` endpoint |
| `src/editor/components/StatusBar.tsx` | **MODIFY** — `Health: 84%` clickable chip |
| `src/editor/components/AIAssistantPanel.tsx` | **MODIFY** — health tab |

---

## 🌐 Feature 5 — One-Click "Understand Project"

### What It Does
Single button. Runs full AI analysis. Auto-generates a complete Project Wiki with Architecture Docs, API Reference, Flow Diagrams, and updates README.

### Generation Flow
```
User clicks "Understand Project"
        ↓
Step 1: Brain scan (if not fresh)
Step 2: LLM → /docs/ARCHITECTURE.md
Step 3: LLM → /docs/API_REFERENCE.md  
Step 4: LLM → /docs/FLOW_DIAGRAMS.md
Step 5: LLM → Update README.md
        ↓
Show live progress + open generated files
```

### New Store — `src/store/useProjectWikiStore.ts`

```ts
type WikiDoc = {
  path: string
  title: string
  content: string
  status: 'pending' | 'generating' | 'done' | 'error'
}

type ProjectWikiState = {
  isGenerating: boolean
  generationLog: string[]
  generatedDocs: WikiDoc[]
  lastGeneratedAt: number | null
  generateWiki: () => Promise<void>
  regenerateDoc: (docPath: string) => Promise<void>
}
```

### New Component — `src/editor/components/ProjectWikiPanel.tsx`

**UI Elements:**
- **"Understand Project"** — big CTA button with animated brain icon
- Live progress log (step-by-step streaming)
- Generated docs list (click → open in editor)
- Preview pane for generated markdown
- "Regenerate" option per document

### TitleBar Integration — `src/editor/components/TitleBar.tsx`
```
[ ← → ] [ NEXO ] [ 📖 Understand ] [ Run ] [ Deploy ] ...
```

### Files Changed

| File | Action |
|---|---|
| `src/store/useProjectWikiStore.ts` | **NEW** — wiki generation state |
| `src/editor/components/ProjectWikiPanel.tsx` | **NEW** — wiki gen UI |
| `backend/routes/wiki.js` | **NEW** — `/api/wiki/generate` endpoint |
| `src/editor/components/TitleBar.tsx` | **MODIFY** — add "Understand" button |

---

## 🎭 Feature 6 — Upgraded AI Team Room (Real LLM Agents)

### Current State
`AITeamPanel.tsx` = **hardcoded setTimeout simulation** (fake responses)

### Target State
**Real LLM calls per agent** with specialized system prompts. Agents genuinely reference each other's responses.

### Agent Personas

| Agent | Specialization | System Prompt Focus |
|---|---|---|
| 🎨 Frontend Agent | React/TypeScript specialist | Component design, UX patterns, state management |
| ⚙️ Backend Agent | API/database architect | Data models, endpoints, server logic |
| 🔐 Security Agent | Security auditor | Vulnerabilities, auth gaps, data exposure |
| 🖌️ UI Agent | Design system expert | Aesthetics, accessibility, responsiveness |
| 🧠 CTO Agent | Decision maker | Synthesizes all, makes final call |

### New Store — `src/store/useTeamRoomStore.ts`

```ts
type TeamAgent = 'frontend' | 'backend' | 'security' | 'ui' | 'cto'

type TeamMessage = {
  id: string
  agent: TeamAgent
  avatar: string
  name: string
  content: string
  timestamp: number
  isStreaming: boolean
  referencesAgents?: TeamAgent[]
}

type TeamRoomState = {
  messages: TeamMessage[]
  isDiscussing: boolean
  goal: string
  setGoal: (goal: string) => void
  startDiscussion: (goal: string) => Promise<void>
  clearDiscussion: () => void
}
```

### Agent Execution Sequence
```
Frontend Agent → streams response about UI/UX approach
      ↓
Backend Agent → responds, references Frontend's approach
      ↓
Security Agent → audits both proposals
      ↓
UI Agent → refines UI/design decisions
      ↓
CTO Agent → reads all 4, makes final implementation decision
```

### Files Changed

| File | Action |
|---|---|
| `src/store/useTeamRoomStore.ts` | **NEW** — real multi-agent orchestration |
| `src/editor/components/AITeamPanel.tsx` | **MODIFY** — replace simulation with real LLM |

---

## 📝 Feature 7 — Auto Documentation Engine

### What It Does
After every major agent file write, NEXO auto-detects what changed and updates the relevant doc file. Zero manual documentation effort.

### Detection Logic
```
Agent writes file
      ↓
Detect change type:
  *.component.tsx created   → update /docs/COMPONENTS.md
  backend/routes/*.js added → update /docs/API_REFERENCE.md
  *schema* / *migration*    → update /docs/DATABASE.md
  package.json changed      → update README setup section
      ↓
LLM: generate targeted small doc update
Append/update correct /docs/*.md file
```

### New Store — `src/store/useAutoDocStore.ts`

```ts
type DocEntry = {
  id: string
  file: string
  docFile: string
  summary: string
  generatedAt: number
}

type AutoDocState = {
  autoDocEnabled: boolean
  docLog: DocEntry[]
  generateDocForFile: (filePath: string, content: string, changeType: string) => Promise<void>
  toggleAutoDoc: () => void
}
```

### Files Changed

| File | Action |
|---|---|
| `src/store/useAutoDocStore.ts` | **NEW** — auto-doc state + generation |
| `src/store/useAgentStore.ts` | **MODIFY** — trigger doc gen after file write |
| `src/store/useProjectWikiStore.ts` | **MODIFY** — feed auto-doc into wiki |

---

## 🔗 Full Integration Flow

```
User types in AI Chat
        ↓
[AI Learning Engine]   → injects coding style preferences
[Project Brain]        → injects full architecture context
[Impact Analysis]      → warns if change is risky (high/critical)
        ↓
Agent Execution (writes files)
        ↓
[CTO Mode]             → analyzes generated code quality
[Auto Documentation]   → updates /docs/ files automatically
[AI Learning Engine]   → learns from accepted code
[Health Dashboard]     → recalculates project health score
        ↓
StatusBar shows: Impact: ● Safe | Health: 87%
```

---

## 🛠️ Backend Routes Summary

| Route | File | Method | Purpose |
|---|---|---|---|
| `/api/archmap/build` | `backend/routes/archmap.js` | POST | Build dependency graph |
| `/api/impact/analyze` | `backend/routes/impact.js` | POST | LLM impact analysis |
| `/api/wiki/generate` | `backend/routes/wiki.js` | POST | Full wiki generation |
| `/api/health/calculate` | `backend/routes/health.js` | POST | Project health score |

---

## 📋 All Files — Checklist

### New Files (13 total)

```
src/store/
  ├── useArchMapStore.ts          ← Architecture map graph state
  ├── useImpactStore.ts           ← Impact analysis state
  ├── useAiLearningStore.ts       ← AI learning/preferences state
  ├── useHealthStore.ts           ← Project health state
  ├── useProjectWikiStore.ts      ← Wiki generation state
  ├── useTeamRoomStore.ts         ← Real multi-agent team state
  └── useAutoDocStore.ts          ← Auto documentation state

src/editor/components/
  ├── ArchitectureMapPanel.tsx    ← Interactive dependency graph UI
  ├── ImpactAnalysisPanel.tsx     ← Impact report card UI
  ├── AiLearningPanel.tsx         ← Coding DNA preferences UI
  ├── ProjectHealthPanel.tsx      ← Health score dashboard UI
  └── ProjectWikiPanel.tsx        ← Wiki generation UI

backend/routes/
  ├── archmap.js                  ← Graph build endpoint
  ├── impact.js                   ← Impact analysis endpoint
  ├── wiki.js                     ← Doc generation endpoint
  └── health.js                   ← Health score endpoint
```

### Modified Files (7 total)

```
src/editor/components/
  ├── AIAssistantPanel.tsx        ← Add MAP, IMPACT, HEALTH, WIKI tabs
  ├── AITeamPanel.tsx             ← Replace simulation → real LLM agents
  ├── StatusBar.tsx               ← Add Health score + Impact indicator
  └── TitleBar.tsx                ← Add "Understand Project" button

src/ai/
  └── contextInjection.ts         ← Inject AI Learning style context

src/store/
  └── useAgentStore.ts            ← Trigger auto-doc after file writes

backend/
  └── index.js                    ← Mount 4 new routes
```

---

## 🎯 Priority Execution Order

| # | Feature | Priority | Files | USP Impact |
|---|---|---|---|---|
| 1 | Impact Analysis Engine | 🔴 P1 | 4 new + 2 modify | **Unique killer feature** |
| 2 | Visual Architecture Map | 🔴 P1 | 3 new + 1 modify | **No IDE has this** |
| 3 | Project Health Dashboard | 🟡 P2 | 4 new + 2 modify | Sticky retention |
| 4 | AI Learning Engine | 🟡 P2 | 3 new + 2 modify | Personalization USP |
| 5 | One-Click Understand | 🟢 P3 | 2 new + 1 modify | WOW demo factor |
| 6 | Upgraded AI Team Room | 🟢 P3 | 1 new + 1 modify | Real multi-agent UX |
| 7 | Auto Documentation | 🔵 P4 | 2 new + 2 modify | Enterprise sticky |

---

## ❓ Open Questions

### Q1 — Architecture Map Graph Engine
| Option | Size | Effort | Layout |
|---|---|---|---|
| **Option A — Pure SVG + Framer Motion** ✅ Recommended | 0 new deps | Medium | Manual |
| Option B — D3-force | ~100KB | Low | Auto |
| Option C — ReactFlow | ~300KB | Very Low | Drag-drop |

### Q2 — Impact Analysis Trigger
| Option | UX |
|---|---|
| A — Manual button only | Least intrusive |
| **B — Auto when AI chat starts** ✅ Recommended | Proactive |
| C — Auto on file tab switch | Always-on |

### Q3 — AI Learning Privacy
| Option | Approach |
|---|---|
| **A — Local only (persist)** ✅ Recommended | Full privacy |
| B — Backend sync | Cross-device |
| C — User choice toggle | Flexible |

### Q4 — Auto Documentation Default
> ⚠️ Running LLM on every file write increases API usage significantly.
> Default: **OFF** — user enables when needed.

---

*Generated: 2026-05-29 | NEXO V3 Phase 2 Roadmap*
