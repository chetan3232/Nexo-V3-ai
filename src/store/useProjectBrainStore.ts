import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──────────────────────────────────────────────────────────────────
export type StackInfo = {
  framework: string;
  stateManager: string;
  database: string;
  styling: string;
  runtime: string;
  language: string;
  bundler: string;
  testing: string;
};

export type ArchitectureMap = {
  pages: string[];
  components: string[];
  stores: string[];
  services: string[];
  routes: string[];
  hooks: string[];
  utils: string[];
};

export type ApiEndpoint = {
  path: string;
  method: string;
  description: string;
  file: string;
};

export type DbTable = {
  table: string;
  columns: string[];
};

export type UiRules = {
  theme: string;
  primaryColor: string;
  fontFamily: string;
  componentPattern: string;
  iconLibrary: string;
};

export type CodingConventions = {
  importStyle: string;
  naming: string;
  fileStructure: string;
  statePattern: string;
};

export type DependencyInfo = {
  name: string;
  version: string;
  type: 'production' | 'dev';
  category: string;
};

export type BusinessFlow = {
  flow: string;
  description: string;
  files: string[];
};

export type ProjectBrain = {
  stack: StackInfo;
  architecture: ArchitectureMap;
  apiSurface: ApiEndpoint[];
  dbSchema: DbTable[];
  uiRules: UiRules;
  conventions: CodingConventions;
  dependencies: DependencyInfo[];
  businessLogic: BusinessFlow[];
};

export type BrainScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

// ── Default empty brain ────────────────────────────────────────────────────
const emptyBrain: ProjectBrain = {
  stack: {
    framework: 'Unknown',
    stateManager: 'Unknown',
    database: 'Unknown',
    styling: 'Unknown',
    runtime: 'Unknown',
    language: 'Unknown',
    bundler: 'Unknown',
    testing: 'Unknown',
  },
  architecture: {
    pages: [],
    components: [],
    stores: [],
    services: [],
    routes: [],
    hooks: [],
    utils: [],
  },
  apiSurface: [],
  dbSchema: [],
  uiRules: {
    theme: 'Unknown',
    primaryColor: 'Unknown',
    fontFamily: 'Unknown',
    componentPattern: 'Unknown',
    iconLibrary: 'Unknown',
  },
  conventions: {
    importStyle: 'Unknown',
    naming: 'Unknown',
    fileStructure: 'Unknown',
    statePattern: 'Unknown',
  },
  dependencies: [],
  businessLogic: [],
};

// ── Store ──────────────────────────────────────────────────────────────────
type ProjectBrainState = {
  brain: ProjectBrain;
  scanStatus: BrainScanStatus;
  scanError: string | null;
  lastScannedAt: number | null;
  scanProgress: number; // 0-100

  scanProject: () => Promise<void>;
  updateBrainSection: <K extends keyof ProjectBrain>(section: K, data: ProjectBrain[K]) => void;
  getBrainContext: () => string;
  getBrainSummary: () => string;
  resetBrain: () => void;
};

const API_BASE = (import.meta as any).env?.VITE_NEXO_API_URL ?? 'http://localhost:8787';

export const useProjectBrainStore = create<ProjectBrainState>()(
  persist(
    (set, get) => ({
      brain: { ...emptyBrain },
      scanStatus: 'idle',
      scanError: null,
      lastScannedAt: null,
      scanProgress: 0,

      resetBrain: () => set({ brain: { ...emptyBrain }, scanStatus: 'idle', lastScannedAt: null, scanProgress: 0 }),

      updateBrainSection: (section, data) => {
        set((s) => ({
          brain: { ...s.brain, [section]: data },
        }));
      },

      scanProject: async () => {
        set({ scanStatus: 'scanning', scanError: null, scanProgress: 5 });

        try {
          // 1. Fetch project file tree
          set({ scanProgress: 10 });
          const treeRes = await fetch(`${API_BASE}/api/fs/tree`);
          const treeData = await treeRes.json();
          const tree = treeData.tree || [];

          // 2. Flatten file paths
          const flatPaths: string[] = [];
          const walk = (nodes: any[]) => {
            nodes.forEach((node: any) => {
              if (node.type === 'file') flatPaths.push(node.path);
              if (node.children) walk(node.children);
            });
          };
          walk(tree);

          set({ scanProgress: 20 });

          // 3. Read package.json for stack detection
          let packageJson: any = {};
          try {
            const pkgRes = await fetch(`${API_BASE}/api/fs/read?path=package.json`);
            const pkgData = await pkgRes.json();
            packageJson = JSON.parse(pkgData.content || '{}');
          } catch { /* no package.json */ }

          set({ scanProgress: 30 });

          // 4. Detect Stack
          const allDeps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
          const depNames = Object.keys(allDeps);

          const stack: StackInfo = {
            framework: depNames.includes('react') ? 'React' : depNames.includes('vue') ? 'Vue' : depNames.includes('next') ? 'Next.js' : depNames.includes('svelte') ? 'Svelte' : 'Unknown',
            stateManager: depNames.includes('zustand') ? 'Zustand' : depNames.includes('redux') ? 'Redux' : depNames.includes('@reduxjs/toolkit') ? 'Redux Toolkit' : depNames.includes('mobx') ? 'MobX' : depNames.includes('recoil') ? 'Recoil' : depNames.includes('jotai') ? 'Jotai' : 'Unknown',
            database: depNames.includes('@supabase/supabase-js') ? 'Supabase' : depNames.includes('firebase') ? 'Firebase' : depNames.includes('@prisma/client') ? 'Prisma' : depNames.includes('mongoose') ? 'MongoDB' : depNames.includes('pg') ? 'PostgreSQL' : 'Unknown',
            styling: depNames.includes('tailwindcss') ? 'Tailwind CSS' : depNames.includes('styled-components') ? 'Styled Components' : depNames.includes('@emotion/react') ? 'Emotion' : depNames.includes('sass') ? 'SASS' : 'Vanilla CSS',
            runtime: depNames.includes('electron') ? 'Electron' : depNames.includes('react-native') ? 'React Native' : 'Browser',
            language: depNames.includes('typescript') ? 'TypeScript' : 'JavaScript',
            bundler: depNames.includes('vite') ? 'Vite' : depNames.includes('webpack') ? 'Webpack' : depNames.includes('esbuild') ? 'esbuild' : depNames.includes('next') ? 'Next.js' : 'Unknown',
            testing: depNames.includes('vitest') ? 'Vitest' : depNames.includes('jest') ? 'Jest' : depNames.includes('@testing-library/react') ? 'Testing Library' : depNames.includes('cypress') ? 'Cypress' : 'None',
          };

          set({ scanProgress: 45 });

          // 5. Detect Architecture from file paths
          const architecture: ArchitectureMap = {
            pages: flatPaths.filter(p => /\/(pages|views)\//i.test(p)),
            components: flatPaths.filter(p => /\/components?\//i.test(p) && /\.(tsx|jsx|vue|svelte)$/.test(p)),
            stores: flatPaths.filter(p => /\/store[s]?\//i.test(p)),
            services: flatPaths.filter(p => /\/services?\//i.test(p)),
            routes: flatPaths.filter(p => /\/routes?\//i.test(p)),
            hooks: flatPaths.filter(p => /\/hooks?\//i.test(p) || /use[A-Z].*\.(ts|js)x?$/.test(p.split('/').pop() || '')),
            utils: flatPaths.filter(p => /\/(utils?|lib|helpers?)\//i.test(p)),
          };

          set({ scanProgress: 55 });

          // 6. Detect API Surface from backend route files
          const apiSurface: ApiEndpoint[] = [];
          const routeFiles = flatPaths.filter(p => /\/routes?\/.*\.(js|ts)$/.test(p));

          for (const routeFile of routeFiles.slice(0, 20)) {
            try {
              const res = await fetch(`${API_BASE}/api/fs/read?path=${encodeURIComponent(routeFile)}`);
              const data = await res.json();
              const content = data.content || '';

              // Parse Express router patterns
              const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
              let match;
              while ((match = routeRegex.exec(content)) !== null) {
                apiSurface.push({
                  method: match[1].toUpperCase(),
                  path: match[2],
                  description: `${match[1].toUpperCase()} ${match[2]}`,
                  file: routeFile,
                });
              }
            } catch { /* skip unreadable files */ }
          }

          set({ scanProgress: 65 });

          // 7. Detect DB Schema from SQL files
          const dbSchema: DbTable[] = [];
          const sqlFiles = flatPaths.filter(p => /\.(sql|prisma)$/i.test(p));

          for (const sqlFile of sqlFiles.slice(0, 5)) {
            try {
              const res = await fetch(`${API_BASE}/api/fs/read?path=${encodeURIComponent(sqlFile)}`);
              const data = await res.json();
              const content = data.content || '';

              const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)(?:\);)/gi;
              let match;
              while ((match = tableRegex.exec(content)) !== null) {
                const tableName = match[1];
                const columnDefs = match[2];
                const columns = columnDefs
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line && !line.startsWith('--') && !line.startsWith('CONSTRAINT') && !line.startsWith('PRIMARY') && !line.startsWith('FOREIGN') && !line.startsWith('UNIQUE') && !line.startsWith(')'))
                  .map(line => {
                    const parts = line.replace(/,\s*$/, '').split(/\s+/);
                    return parts[0];
                  })
                  .filter(col => col && col.length > 0);

                dbSchema.push({ table: tableName, columns });
              }
            } catch { /* skip unreadable files */ }
          }

          set({ scanProgress: 75 });

          // 8. Detect UI Rules from CSS/config files
          const uiRules: UiRules = {
            theme: 'dark', // Default for IDE projects
            primaryColor: '#3b82f6',
            fontFamily: 'Inter',
            componentPattern: stack.framework === 'React' ? 'Functional Components + Hooks' : 'Unknown',
            iconLibrary: depNames.includes('lucide-react') ? 'Lucide React' : depNames.includes('react-icons') ? 'React Icons' : depNames.includes('@heroicons/react') ? 'Heroicons' : 'None',
          };

          // Try to read globals.css for theme detection
          const cssFiles = flatPaths.filter(p => /(globals?|index|app)\.(css|scss)$/i.test(p));
          for (const cssFile of cssFiles.slice(0, 3)) {
            try {
              const res = await fetch(`${API_BASE}/api/fs/read?path=${encodeURIComponent(cssFile)}`);
              const data = await res.json();
              const content = data.content || '';

              if (content.includes('dark') || content.includes('#0d1117') || content.includes('#111827')) {
                uiRules.theme = 'dark';
              } else if (content.includes('light') || content.includes('#ffffff') || content.includes('#f9fafb')) {
                uiRules.theme = 'light';
              }

              const fontMatch = content.match(/font-family[:\s]*['"]?([^;'"}\n]+)/i);
              if (fontMatch) uiRules.fontFamily = fontMatch[1].trim().split(',')[0].replace(/['"]/g, '');

              const colorMatch = content.match(/--primary[:\s]*([^;\n]+)/i) || content.match(/--accent[:\s]*([^;\n]+)/i);
              if (colorMatch) uiRules.primaryColor = colorMatch[1].trim();
            } catch { /* skip */ }
          }

          set({ scanProgress: 85 });

          // 9. Detect Coding Conventions
          const conventions: CodingConventions = {
            importStyle: flatPaths.some(p => p.endsWith('.tsx') || p.endsWith('.ts'))
              ? 'ES Modules (import/export)'
              : 'CommonJS (require/module.exports)',
            naming: 'camelCase (files), PascalCase (components)',
            fileStructure: flatPaths.some(p => p.includes('/features/'))
              ? 'Feature-based'
              : flatPaths.some(p => p.includes('/components/') && p.includes('/store/'))
                ? 'Layer-based (components/store/services)'
                : 'Flat',
            statePattern: stack.stateManager !== 'Unknown'
              ? `${stack.stateManager} stores`
              : 'Local state (useState)',
          };

          set({ scanProgress: 90 });

          // 10. Build Dependencies List
          const dependencies: DependencyInfo[] = [];
          const prodDeps = packageJson.dependencies || {};
          const devDeps = packageJson.devDependencies || {};

          const categorize = (name: string): string => {
            if (['react', 'react-dom', 'vue', 'svelte', 'next'].includes(name)) return 'Framework';
            if (['zustand', 'redux', 'mobx', 'recoil', 'jotai'].includes(name)) return 'State Management';
            if (name.includes('supabase') || name.includes('firebase') || name.includes('prisma') || name.includes('mongoose')) return 'Database';
            if (['tailwindcss', 'sass', 'styled-components', '@emotion/react'].includes(name)) return 'Styling';
            if (['vite', 'webpack', 'esbuild', 'rollup'].includes(name)) return 'Build Tool';
            if (['typescript', 'eslint', 'prettier'].includes(name)) return 'Developer Tool';
            if (name.includes('test') || name.includes('jest') || name.includes('vitest') || name.includes('cypress')) return 'Testing';
            if (name.includes('lucide') || name.includes('icon')) return 'UI Library';
            return 'Other';
          };

          for (const [name, version] of Object.entries(prodDeps)) {
            dependencies.push({ name, version: String(version), type: 'production', category: categorize(name) });
          }
          for (const [name, version] of Object.entries(devDeps)) {
            dependencies.push({ name, version: String(version), type: 'dev', category: categorize(name) });
          }

          set({ scanProgress: 95 });

          // 11. Detect Business Logic Flows
          const businessLogic: BusinessFlow[] = [];
          if (architecture.routes.some(r => r.includes('auth'))) {
            businessLogic.push({
              flow: 'Authentication',
              description: 'User auth system detected',
              files: architecture.routes.filter(r => r.includes('auth')),
            });
          }
          if (architecture.routes.some(r => r.includes('message') || r.includes('chat') || r.includes('conversation'))) {
            businessLogic.push({
              flow: 'Chat / Messaging',
              description: 'Chat or messaging system detected',
              files: architecture.routes.filter(r => r.includes('message') || r.includes('chat') || r.includes('conversation')),
            });
          }
          if (architecture.routes.some(r => r.includes('deploy'))) {
            businessLogic.push({
              flow: 'Deployment',
              description: 'Deployment pipeline detected',
              files: architecture.routes.filter(r => r.includes('deploy')),
            });
          }
          if (architecture.stores.some(s => s.includes('Agent') || s.includes('agent'))) {
            businessLogic.push({
              flow: 'AI Agent System',
              description: 'Multi-agent orchestration system detected',
              files: architecture.stores.filter(s => s.includes('Agent') || s.includes('agent')),
            });
          }

          // 12. Set final brain
          const finalBrain: ProjectBrain = {
            stack,
            architecture,
            apiSurface,
            dbSchema,
            uiRules,
            conventions,
            dependencies,
            businessLogic,
          };

          set({
            brain: finalBrain,
            scanStatus: 'ready',
            scanProgress: 100,
            lastScannedAt: Date.now(),
            scanError: null,
          });

          console.log('[Project Brain] Scan complete:', finalBrain);
        } catch (err: any) {
          console.error('[Project Brain] Scan failed:', err);
          set({
            scanStatus: 'error',
            scanError: err.message || 'Brain scan failed',
            scanProgress: 0,
          });
        }
      },

      getBrainContext: () => {
        const { brain, scanStatus } = get();
        if (scanStatus !== 'ready') return '';

        const lines: string[] = [
          '=== PROJECT BRAIN ===',
          `Stack: ${brain.stack.framework} + ${brain.stack.stateManager} + ${brain.stack.database} + ${brain.stack.styling}`,
          `Language: ${brain.stack.language} | Bundler: ${brain.stack.bundler} | Runtime: ${brain.stack.runtime}`,
          `Architecture: ${brain.architecture.components.length} components, ${brain.architecture.stores.length} stores, ${brain.architecture.services.length} services, ${brain.architecture.routes.length} routes`,
          `API Surface: ${brain.apiSurface.length} endpoints`,
          `DB Schema: ${brain.dbSchema.length} tables`,
          `UI: ${brain.uiRules.theme} theme, ${brain.uiRules.primaryColor} primary, ${brain.uiRules.fontFamily} font, ${brain.uiRules.iconLibrary} icons`,
          `Conventions: ${brain.conventions.importStyle}, ${brain.conventions.naming}, ${brain.conventions.statePattern}`,
        ];

        if (brain.apiSurface.length > 0) {
          lines.push('API Endpoints:');
          brain.apiSurface.slice(0, 15).forEach(ep => {
            lines.push(`  ${ep.method} ${ep.path} (${ep.file})`);
          });
        }

        if (brain.dbSchema.length > 0) {
          lines.push('Database Tables:');
          brain.dbSchema.forEach(t => {
            lines.push(`  ${t.table}: ${t.columns.join(', ')}`);
          });
        }

        if (brain.businessLogic.length > 0) {
          lines.push('Business Logic Flows:');
          brain.businessLogic.forEach(bl => {
            lines.push(`  ${bl.flow}: ${bl.description}`);
          });
        }

        lines.push('=== END PROJECT BRAIN ===');
        return lines.join('\n');
      },

      getBrainSummary: () => {
        const { brain, scanStatus } = get();
        if (scanStatus !== 'ready') return 'Brain not scanned yet.';
        return `${brain.stack.framework} + ${brain.stack.stateManager} + ${brain.stack.database} | ${brain.architecture.components.length} components | ${brain.apiSurface.length} API endpoints | ${brain.dbSchema.length} DB tables`;
      },
    }),
    {
      name: 'nexo-project-brain-v1',
      partialize: (state) => ({
        brain: state.brain,
        scanStatus: state.scanStatus,
        lastScannedAt: state.lastScannedAt,
      }),
    }
  )
);
