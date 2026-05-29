import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

const normalizePath = (p) => p.replaceAll('\\', '/');

const isParsable = (file) => /\.(js|ts|jsx|tsx|vue|svelte)$/.test(file);

// Resolve relative imports to absolute or workspace relative paths
function resolveImportPath(currentFileRel, importString) {
  if (!importString.startsWith('.')) {
    // Treat as package import or alias (return null for mapping simplicity)
    return null;
  }
  const currentDir = path.dirname(currentFileRel);
  const resolved = path.join(currentDir, importString);
  return normalizePath(resolved);
}

// Map file paths to node categories
function getNodeType(filePath) {
  const lowercase = filePath.toLowerCase();
  if (/\.(test|spec)\./i.test(lowercase)) return 'hook';
  if (lowercase.includes('/components/')) return 'component';
  if (lowercase.includes('/store/') || lowercase.includes('/stores/')) return 'store';
  if (lowercase.includes('/services/') || lowercase.includes('/service/')) return 'service';
  if (lowercase.includes('/routes/') || lowercase.includes('/route/') || lowercase.includes('/backend/routes/')) return 'route';
  if (lowercase.includes('/api/')) return 'api';
  if (lowercase.includes('/pages/') || lowercase.includes('/views/')) return 'page';
  if (lowercase.includes('/hooks/') || /use[A-Z]/.test(filePath)) return 'hook';
  return 'hook'; // Fallback
}

// POST /api/archmap/build
router.post('/build', async (req, res) => {
  const root = getWorkspaceRoot();
  const nodes = [];
  const edges = [];
  const nodeSet = new Set();

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = normalizePath(path.relative(root, fullPath));

      if (['node_modules', 'dist', '.git', '.nexo', '.npm-cache', 'dist', 'build'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && isParsable(entry.name)) {
        const id = relPath;
        if (!nodeSet.has(id)) {
          nodeSet.add(id);
          nodes.push({
            id,
            path: id,
            label: path.basename(id),
            type: getNodeType(id),
            description: `Workspace file: ${id}`
          });
        }

        try {
          const content = await fs.readFile(fullPath, 'utf8');
          // Parse ESM import statements: import ... from './something'
          const esmImportRegex = /(?:import|export)\s+.*?from\s+['"\`](.*?)['"\`]/g;
          // Parse CommonJS require: require('./something')
          const cjsRequireRegex = /require\s*\(\s*['"\`](.*?)['"\`]\s*\)/g;

          let match;
          // Extract ESM
          while ((match = esmImportRegex.exec(content)) !== null) {
            const importStr = match[1];
            const resolved = resolveImportPath(id, importStr);
            if (resolved) {
              // Try extensions
              const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js', '/index.tsx'];
              for (const ext of possibleExtensions) {
                const targetId = resolved + ext;
                if (targetId !== id) {
                  edges.push({
                    from: id,
                    to: targetId,
                    type: 'import'
                  });
                }
              }
            }
          }

          // Extract CJS
          while ((match = cjsRequireRegex.exec(content)) !== null) {
            const importStr = match[1];
            const resolved = resolveImportPath(id, importStr);
            if (resolved) {
              const possibleExtensions = ['', '.js', '.ts', '/index.js', '/index.ts'];
              for (const ext of possibleExtensions) {
                const targetId = resolved + ext;
                if (targetId !== id) {
                  edges.push({
                    from: id,
                    to: targetId,
                    type: 'import'
                  });
                }
              }
            }
          }

        } catch (e) {
          // ignore unreadable
        }
      }
    }
  }

  try {
    await walk(root);

    // Filter edges to only link nodes that actually exist in the nodes set
    const validEdges = edges.filter(edge => nodeSet.has(edge.from) && nodeSet.has(edge.to));

    // Deduplicate edges
    const uniqueEdgesMap = new Map();
    validEdges.forEach(edge => {
      const key = `${edge.from}->${edge.to}`;
      uniqueEdgesMap.set(key, edge);
    });

    return res.json({
      success: true,
      nodes,
      edges: Array.from(uniqueEdgesMap.values())
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
