import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = express.Router();

const getWorkspaceRoot = () => path.resolve(process.env.NEXO_WORKSPACE_ROOT ?? process.cwd());

// Helper to write file safely
async function safeWrite(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

// POST /api/wiki/generate
router.post('/generate', async (req, res) => {
  const { brain } = req.body;
  const root = getWorkspaceRoot();

  if (!brain) {
    return res.status(400).json({ error: 'Project brain data is required' });
  }

  try {
    const docsDir = path.join(root, 'docs');

    // 1. Generate Architecture markdown
    const archMarkdown = `# Project Architecture — Wiki

Generated automatically by NEXO V3.

## Stack Overview
- **Framework**: ${brain.stack?.framework || 'Unknown'}
- **State Management**: ${brain.stack?.stateManager || 'Unknown'}
- **Database**: ${brain.stack?.database || 'Unknown'}
- **Styling**: ${brain.stack?.styling || 'Unknown'}
- **Bundler**: ${brain.stack?.bundler || 'Unknown'}

## Components Map
This project contains ${brain.architecture?.components?.length || 0} active React/UI components.
${(brain.architecture?.components || []).slice(0, 10).map(c => `- \`${c}\``).join('\n')}

## Services & Stores
- **Zustand Stores**: ${brain.architecture?.stores?.length || 0} stores identified.
- **Backend/External Services**: ${brain.architecture?.services?.length || 0} services.
`;

    // 2. Generate API Reference markdown
    const apiMarkdown = `# API Reference Surface

Detailed router surface endpoints discovered inside the backend:

| Method | Endpoint Path | Source File |
|---|---|---|
${(brain.apiSurface || []).map(ep => `| **${ep.method}** | \`${ep.path}\` | \`${ep.file}\` |`).join('\n') || '| - | - | - |'}
`;

    // 3. Generate Flow Diagrams markdown
    const flowMarkdown = `# Business Flow Diagrams

Overview of the semantic business logic mapped within the project structure:

${(brain.businessLogic || []).map(flow => `
### ${flow.flow}
- **Description**: ${flow.description}
- **Involved Modules**: ${flow.files.map(f => `\`${f}\``).join(', ')}
`).join('\n') || 'No major logic flows cataloged yet.'}
`;

    // 4. Write all files
    await safeWrite(path.join(docsDir, 'ARCHITECTURE.md'), archMarkdown);
    await safeWrite(path.join(docsDir, 'API_REFERENCE.md'), apiMarkdown);
    await safeWrite(path.join(docsDir, 'FLOW_DIAGRAMS.md'), flowMarkdown);

    // 5. Optionally refine via LLM if keys exist
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `Refine this README file content to make it look professional, modern, and include links to documentation in the ./docs/ directory (ARCHITECTURE.md, API_REFERENCE.md, FLOW_DIAGRAMS.md). Mapped stack: ${JSON.stringify(brain.stack)}. Return refined README markdown content. Output raw markdown only.`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        if (response.ok) {
          const result = await response.json();
          const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            await safeWrite(path.join(root, 'README.md'), text);
          }
        }
      } catch (err) {
        console.error('[Wiki Backend] LLM README refinement failed:', err.message);
      }
    }

    return res.json({
      success: true,
      filesWritten: [
        'docs/ARCHITECTURE.md',
        'docs/API_REFERENCE.md',
        'docs/FLOW_DIAGRAMS.md',
        'README.md'
      ]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
