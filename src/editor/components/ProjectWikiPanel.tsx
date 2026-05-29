import { useProjectWikiStore } from '@/store/useProjectWikiStore';
import { useEditorStore } from '@/store/useEditorStore';
import { BookOpen, RefreshCw, FileText, CheckCircle, ExternalLink, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProjectWikiPanel() {
  const { isGenerating, generationLog, generatedDocs, generateWiki, lastGeneratedAt } = useProjectWikiStore();
  const { openFile } = useEditorStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '14px', overflowY: 'auto' }}>
      
      {/* ── Main CTA: Understand Project ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '20px 14px', gap: '10px'
      }}>
        <div style={{
          width: '50px', height: '50px', borderRadius: '50%',
          background: isGenerating ? 'rgba(167, 139, 250, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BookOpen size={24} color={isGenerating ? '#a78bfa' : '#3b82f6'} className={isGenerating ? 'animate-bounce' : ''} />
        </div>

        <div>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px' }}>
            Understand Entire Project
          </h3>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, maxWidth: '280px', lineHeight: '1.4' }}>
            AI parses imports, database schemas, APIs, and business rules to build `/docs` Markdown Wikpedia.
          </p>
        </div>

        <button
          onClick={() => generateWiki()}
          disabled={isGenerating}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: isGenerating ? '#1f2937' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: 'none', borderRadius: '6px', color: isGenerating ? '#4b5563' : 'white',
            fontSize: '12px', fontWeight: 600, padding: '8px 24px',
            cursor: isGenerating ? 'not-allowed' : 'pointer', marginTop: '6px',
            boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.25)',
            transition: 'transform 100ms'
          }}
        >
          {isGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} fill="white" />}
          {isGenerating ? 'Analyzing Workspace...' : 'Generate Project Wiki'}
        </button>
      </div>

      {/* ── Generated Docs List ── */}
      {generatedDocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>GENERATED DOCUMENTATION</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {generatedDocs.map(doc => (
              <button
                key={doc.path}
                onClick={() => openFile(doc.path)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                  borderRadius: '6px', padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                  transition: 'background 120ms'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} color="#60a5fa" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{doc.title}</div>
                    <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '1.5px' }}>/{doc.path}</div>
                  </div>
                </div>
                <ExternalLink size={12} color="#4b5563" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Live Progress Logs Console ── */}
      {generationLog.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>GENERATION LOG</span>
          <div style={{
            background: '#070a0f', border: '1px solid #1f2937', borderRadius: '6px',
            padding: '8px 10px', maxHeight: '140px', overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6b7280',
            display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.4'
          }}>
            {generationLog.map((logLine, idx) => (
              <div key={idx} style={{ color: logLine.includes('❌') ? '#ef4444' : logLine.includes('🎉') ? '#10b981' : '#6b7280' }}>
                {logLine}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
export default ProjectWikiPanel;
