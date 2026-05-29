import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

const normalizePath = (p) => p.replaceAll('\\', '/');

async function scanWorkspaceForHealth() {
  const root = getWorkspaceRoot();
  const allFiles = [];
  
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
      } else if (entry.isFile()) {
        allFiles.push({
          name: entry.name,
          path: relPath,
          fullPath
        });
      }
    }
  }

  try {
    await walk(root);
  } catch (e) {
    console.error('[Health Backend] walk error:', e);
  }

  return allFiles;
}

// POST /api/health/calculate
router.post('/calculate', async (req, res) => {
  try {
    const files = await scanWorkspaceForHealth();

    let securityIssues = [];
    let performanceIssues = [];
    let maintainabilityIssues = [];
    let testingIssues = [];
    let documentationIssues = [];

    let totalJsTsFiles = 0;
    let testFilesCount = 0;
    let totalLinesCount = 0;
    let documentedFilesCount = 0;

    for (const file of files) {
      const ext = path.extname(file.name);
      const lowercaseName = file.name.toLowerCase();

      // Check documentation files
      if (['readme.md', 'architecture.md', 'api_reference.md', 'database.md', 'flow_diagrams.md'].includes(lowercaseName)) {
        documentedFilesCount++;
      }

      if (/\.(js|ts|jsx|tsx|vue|svelte)$/.test(file.name)) {
        totalJsTsFiles++;
        if (/\.(test|spec)\./.test(lowercaseName) || lowercaseName.includes('__tests__')) {
          testFilesCount++;
        }

        try {
          const content = await fs.readFile(file.fullPath, 'utf8');
          const lines = content.split('\n');
          totalLinesCount += lines.length;

          // 1. Security scanning
          if (content.includes('process.env') && !file.path.includes('config') && content.match(/(key|secret|password|token)\s*=\s*['"`][a-zA-Z0-9_\-]{8,}['"`]/i)) {
            securityIssues.push(`Hardcoded API credential key pattern identified in ${file.path}`);
          }
          if (content.includes('dangerouslySetInnerHTML') || content.includes('eval(')) {
            securityIssues.push(`Potential unsanitized markup injector found in ${file.path}`);
          }

          // 2. Performance scanning
          if (lines.length > 800) {
            performanceIssues.push(`File exceeds 800 lines of code: ${file.path}. Consider chunking.`);
          }
          if (content.includes('import ') && content.includes('framer-motion') && !content.includes('lazy')) {
            performanceIssues.push(`Non-lazy motion components loaded in ${file.path}`);
          }

          // 3. Maintainability scanning
          if (lines.length > 500) {
            maintainabilityIssues.push(`Large file complexity: ${file.path} contains ${lines.length} lines.`);
          }
          const nestedDepth = file.path.split('/').length;
          if (nestedDepth > 5) {
            maintainabilityIssues.push(`Deep nesting structure: ${file.path} is nested ${nestedDepth} folders deep.`);
          }

        } catch (e) {
          // Skip reading issues
        }
      }
    }

    // Calculations
    const securityScore = Math.max(0, 100 - securityIssues.length * 15);
    
    // Performance score calculations
    const performanceScore = Math.max(0, 100 - performanceIssues.length * 10);
    
    // Maintainability score calculations
    const maintainabilityScore = Math.max(0, 100 - maintainabilityIssues.length * 8);

    // Testing score calculations
    const testRatio = totalJsTsFiles > 0 ? (testFilesCount / totalJsTsFiles) : 0;
    const testingScore = Math.min(100, Math.round(testRatio * 300) + (testFilesCount > 0 ? 40 : 10)); // simple projection

    // Documentation score calculations
    const docsScore = Math.min(100, documentedFilesCount * 25 + 20);

    const categories = [
      { name: 'security', score: securityScore, weight: 0.25, icon: 'Shield', trend: 'stable', details: securityIssues.slice(0, 4) },
      { name: 'performance', score: performanceScore, weight: 0.25, icon: 'Zap', trend: 'stable', details: performanceIssues.slice(0, 4) },
      { name: 'maintainability', score: maintainabilityScore, weight: 0.25, icon: 'Cpu', trend: 'stable', details: maintainabilityIssues.slice(0, 4) },
      { name: 'testing', score: testingScore, weight: 0.15, icon: 'TestTube', trend: 'stable', details: testFilesCount > 0 ? [`Found ${testFilesCount} test suites.`] : ['Zero test suites identified. Run tests to improve coverage.'] },
      { name: 'documentation', score: docsScore, weight: 0.10, icon: 'FileText', trend: 'stable', details: [`Found ${documentedFilesCount} workspace documents.`] }
    ];

    const healthScore = Math.round(
      categories.reduce((acc, cat) => acc + cat.score * cat.weight, 0)
    );

    // Generate suggestions
    const suggestions = [];
    if (securityIssues.length > 0) {
      suggestions.push({
        priority: 'high',
        category: 'security',
        title: 'Sanitize Hardcoded Credentials',
        description: 'Remove secrets from workspace code and use dotenv configuration instead.',
        action: 'Refactor env variables',
        autoFixable: false
      });
    }
    if (performanceIssues.length > 0) {
      suggestions.push({
        priority: 'high',
        category: 'performance',
        title: 'Lazy Load Heavy Layouts',
        description: 'Use React.lazy() to dynamically chunk loading layout files.',
        action: 'Inject dynamic loading',
        autoFixable: true
      });
    }
    if (testFilesCount === 0) {
      suggestions.push({
        priority: 'medium',
        category: 'testing',
        title: 'Write Basic Suite Checks',
        description: 'No tests found. Add a basic vitest test suites structure under tests directory.',
        action: 'Generate mock tests',
        autoFixable: true
      });
    }
    if (documentedFilesCount < 3) {
      suggestions.push({
        priority: 'medium',
        category: 'documentation',
        title: 'Generate Project Wiki Docs',
        description: 'Ensure comprehensive wiki pages: Architecture, API surface, Database schema.',
        action: 'Generate docs',
        autoFixable: true
      });
    }
    if (maintainabilityIssues.length > 0) {
      suggestions.push({
        priority: 'low',
        category: 'maintainability',
        title: 'Refactor Modular Imports',
        description: 'Split large files containing several helper utilities into smaller components.',
        action: 'Chunk layouts',
        autoFixable: false
      });
    }

    return res.json({
      success: true,
      healthScore,
      categories,
      suggestions,
      lastCalculatedAt: Date.now()
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
