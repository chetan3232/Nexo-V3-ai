import { useState } from 'react';
import { useAiLearningStore, CodingPreference } from '@/store/useAiLearningStore';
import { Cpu, Trash2, ToggleLeft, ToggleRight, Sparkles, Plus, PlusCircle, Check, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export function AiLearningPanel() {
  const { preferences, isLearningEnabled, toggleLearning, learnFromDecision, forgetPreference, resetAll } = useAiLearningStore();

  const [category, setCategory] = useState<CodingPreference['category']>('patterns');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !value.trim()) return;
    learnFromDecision(category, key.trim(), value.trim());
    setKey('');
    setValue('');
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'framework': return '#3b82f6';
      case 'state': return '#f97316';
      case 'styling': return '#ec4899';
      case 'naming': return '#a855f7';
      case 'imports': return '#14b8a6';
      default: return '#10b981';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d1117', color: '#e2e8f0', padding: '14px', gap: '14px', overflowY: 'auto' }}>
      
      {/* ── DNA Control Cockpit ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '12px 14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#a78bfa" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>NEXO Coding DNA</span>
            <span style={{ fontSize: '9.5px', color: '#6b7280', marginTop: '1.5px' }}>Learn preferences from your edits.</span>
          </div>
        </div>

        <button
          onClick={toggleLearning}
          style={{ background: 'transparent', border: 'none', color: isLearningEnabled ? '#10b981' : '#6b7280', cursor: 'pointer', display: 'flex' }}
        >
          {isLearningEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>

      {/* ── Teach NEXO form ── */}
      <form onSubmit={handleAddManual} style={{
        background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937',
        borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <PlusCircle size={11} />
          TEACH NEXO EXPLICIT PREFERENCE
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '8.5px', color: '#6b7280', fontWeight: 600 }}>CATEGORY</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              style={{
                background: '#111827', border: '1px solid #1f2937', borderRadius: '4px',
                color: '#e2e8f0', fontSize: '11px', padding: '4px', outline: 'none'
              }}
            >
              <option value="framework">Framework</option>
              <option value="state">State</option>
              <option value="styling">Styling</option>
              <option value="naming">Naming</option>
              <option value="imports">Imports</option>
              <option value="patterns">Patterns</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label style={{ fontSize: '8.5px', color: '#6b7280', fontWeight: 600 }}>RULE KEY</label>
            <input
              type="text"
              placeholder="e.g. icon_library"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{
                background: '#111827', border: '1px solid #1f2937', borderRadius: '4px',
                color: '#e2e8f0', fontSize: '11px', padding: '4px 6px', outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <label style={{ fontSize: '8.5px', color: '#6b7280', fontWeight: 600 }}>VALUE PREFERENCE</label>
          <input
            type="text"
            placeholder="e.g. Lucide React icons"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              background: '#111827', border: '1px solid #1f2937', borderRadius: '4px',
              color: '#e2e8f0', fontSize: '11px', padding: '4px 6px', outline: 'none'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!key.trim() || !value.trim()}
          style={{
            background: '#3b82f6', border: 'none', borderRadius: '4px',
            color: 'white', fontSize: '11px', fontWeight: 600, padding: '5px 0',
            cursor: (!key.trim() || !value.trim()) ? 'not-allowed' : 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px'
          }}
        >
          <Plus size={11} />
          Teach Rule
        </button>
      </form>

      {/* ── DNA Rules List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>OBSERVED DNA MATRICES</span>
          {preferences.length > 0 && (
            <button
              onClick={() => resetAll()}
              style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '10px', cursor: 'pointer' }}
            >
              Clear DNA
            </button>
          )}
        </div>

        {preferences.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid #1f2937', borderRadius: '6px', fontSize: '11.5px', color: '#6b7280' }}>
            <Info size={13} />
            No preferences observed yet. Write code or teach a rule to compile DNA.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {preferences.map((pref) => {
              const catColor = getCategoryColor(pref.category);
              return (
                <div key={pref.key} style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid #1f2937',
                  borderRadius: '6px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                        color: catColor, background: `${catColor}15`,
                        padding: '1px 5px', borderRadius: '3px', border: `1px solid ${catColor}25`
                      }}>{pref.category}</span>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f3f4f6' }}>{pref.key}</span>
                    </div>

                    <button
                      onClick={() => forgetPreference(pref.key)}
                      style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 4px' }}>
                    Preference: **{pref.value}**
                  </p>

                  {/* Confidence bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '3px', background: '#111827', borderRadius: '1.5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pref.confidence * 100}%`, background: catColor, borderRadius: '1.5px' }} />
                    </div>
                    <span style={{ fontSize: '9px', color: '#4b5563', fontWeight: 600 }}>
                      {Math.round(pref.confidence * 100)}% Match
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
export default AiLearningPanel;
