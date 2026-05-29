import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

// Helper to check if file has JS/TS/Vue extension
const isParsable = (file) => /\.(js|ts|jsx|tsx|vue|svelte)$/.test(file);

// Clean path format helper
const normalizePath = (p) => p.replaceAll('\\', '/');

// Search files for imports/requires of a target file
async function findDependents(targetRelPath) {
  const root = getWorkspaceRoot();
  const dependents = [];

  const targetBase = path.basename(targetRelPath, path.extname(targetRelPath));

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(root, fullPath);

      if (['node_modules', 'dist', '.git', '.nexo', '.npm-cache', 'dist'].includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && isParsable(entry.name)) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          // Simple regex search for targetBase import
          const importRegex = new RegExp(`(import|require|from)\\s*['"\`].*?\\b${targetBase}\\b.*?['"\`]`, 'i');
          if (importRegex.test(content)) {
            dependents.push(normalizePath(relPath));
          }
        } catch (e) {
          // ignore unreadable
        }
      }
    }
  }

  try {
    await walk(root);
  } catch (err) {
    console.error('[Impact Backend] walk error:', err);
  }

  return dependents;
}

// POST /api/impact/analyze
router.post('/analyze', async (req, res) => {
  const { targetFile, changeDescription } = req.body;
  if (!targetFile) {
    return res.status(400).json({ error: 'targetFile is required' });
  }

  try {
    const root = getWorkspaceRoot();
    const cleanTarget = normalizePath(targetFile);

    // 1. Trace dependents
    const dependents = await findDependents(cleanTarget);

    // 2. Compute risk metrics
    let overallRisk = 'low';
    if (dependents.length > 5) {
      overallRisk = 'critical';
    } else if (dependents.length > 2) {
      overallRisk = 'high';
    } else if (dependents.length > 0) {
      overallRisk = 'medium';
    }

    // 3. Fallback/Default breakage scenarios & steps
    const cleanDesc = changeDescription || 'Modify file contents';
    const filename = path.basename(cleanTarget);

    let breakageScenarios = [
      `Downstream components importing "${filename}" may fail compilation if exports are renamed or removed.`,
      `Module loading mismatch in dependencies: ${dependents.slice(0, 3).join(', ') || 'none'}`
    ];
    let safeRefactorSteps = [
      `Inspect the signature of "${filename}" exports before implementing modifications.`,
      `Validate type correctness by running "npx tsc --noEmit" after editing.`,
      `Update corresponding imports in dependent files if function signatures change.`
    ];

    // 4. Try LLM Refinement if keys are active
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `You are a Senior Project Architect. Perform a codebase Impact Analysis for the following planned change:
Target File: ${cleanTarget}
Planned Change: ${cleanDesc}
Files depending on this target: ${JSON.stringify(dependents)}

Return a JSON object containing:
- overallRisk: "low" | "medium" | "high" | "critical"
- breakageScenarios: string[] (top 2-3 specific breakage risks)
- safeRefactorSteps: string[] (top 3-4 refactor safety steps)

Output raw JSON only. Do not write markdown tags.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(text);
          if (parsed.overallRisk) overallRisk = parsed.overallRisk;
          if (parsed.breakageScenarios) breakageScenarios = parsed.breakageScenarios;
          if (parsed.safeRefactorSteps) safeRefactorSteps = parsed.safeRefactorSteps;
        }
      } catch (e) {
        console.error('[Impact Backend] Gemini LLM refinement skipped:', e.message);
      }
    } else if (openaiKey) {
      try {
        const prompt = `Perform an Impact Analysis for:
Target File: ${cleanTarget}
Change Description: ${cleanDesc}
Dependent Files: ${JSON.stringify(dependents)}

Response format: JSON object with keys "overallRisk", "breakageScenarios", "safeRefactorSteps". Output raw JSON.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const content = result.choices?.[0]?.message?.content;
          const parsed = JSON.parse(content);
          if (parsed.overallRisk) overallRisk = parsed.overallRisk;
          if (parsed.breakageScenarios) breakageScenarios = parsed.breakageScenarios;
          if (parsed.safeRefactorSteps) safeRefactorSteps = parsed.safeRefactorSteps;
        }
      } catch (e) {
        console.error('[Impact] OpenAI refinement skipped:', e.message);
      }
    }

    const report = {
      id: crypto.randomUUID(),
      targetFile: cleanTarget,
      changeDescription: cleanDesc,
      affectedFiles: dependents.map(path => {
        let risk = 'low';
        if (overallRisk === 'critical' || overallRisk === 'high') {
          risk = 'high';
        } else if (overallRisk === 'medium') {
          risk = 'medium';
        }
        return {
          path,
          reason: `Imports exports defined in ${filename}`,
          risk
        };
      }),
      overallRisk,
      breakageScenarios,
      safeRefactorSteps,
      timestamp: Date.now()
    };

    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
