import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CodingPreference = {
  category: 'framework' | 'state' | 'styling' | 'naming' | 'imports' | 'testing' | 'patterns';
  key: string;
  value: string;
  confidence: number; // 0.0 - 1.0
  learnedAt: number;
  source: 'explicit' | 'observed';
};

type AiLearningState = {
  preferences: CodingPreference[];
  isLearningEnabled: boolean;
  toggleLearning: () => void;
  learnFromCode: (code: string, filePath: string) => Promise<void>;
  learnFromDecision: (category: CodingPreference['category'], key: string, value: string) => void;
  getStyleContext: () => string;  // Injected into prompt templates
  forgetPreference: (key: string) => void;
  resetAll: () => void;
};

export const useAiLearningStore = create<AiLearningState>()(
  persist(
    (set, get) => ({
      preferences: [],
      isLearningEnabled: true,

      toggleLearning: () => set((s) => ({ isLearningEnabled: !s.isLearningEnabled })),

      forgetPreference: (key) => set((s) => ({
        preferences: s.preferences.filter(p => p.key !== key)
      })),

      resetAll: () => set({ preferences: [] }),

      learnFromDecision: (category, key, value) => {
        const { preferences } = get();
        const existingIdx = preferences.findIndex(p => p.key === key);

        const newPref: CodingPreference = {
          category,
          key,
          value,
          confidence: 1.0,
          learnedAt: Date.now(),
          source: 'explicit'
        };

        const nextPrefs = [...preferences];
        if (existingIdx > -1) {
          nextPrefs[existingIdx] = newPref;
        } else {
          nextPrefs.push(newPref);
        }
        set({ preferences: nextPrefs });
      },

      learnFromCode: async (code: string, filePath: string) => {
        if (!get().isLearningEnabled || !code) return;

        const nextPrefs = [...get().preferences];
        const updateOrAddPref = (category: CodingPreference['category'], key: string, value: string, weight = 0.2) => {
          const idx = nextPrefs.findIndex(p => p.key === key);
          if (idx > -1) {
            const current = nextPrefs[idx];
            // Increase confidence if the same pattern matches
            const nextConfidence = Math.min(1.0, current.value === value ? current.confidence + weight : current.confidence - weight);
            if (nextConfidence < 0.2) {
              // Drift preference if style shifted
              nextPrefs[idx] = { ...current, value, confidence: 0.3, learnedAt: Date.now() };
            } else {
              nextPrefs[idx] = { ...current, confidence: nextConfidence, learnedAt: Date.now() };
            }
          } else {
            nextPrefs.push({
              category,
              key,
              value,
              confidence: 0.4,
              learnedAt: Date.now(),
              source: 'observed'
            });
          }
        };

        // 1. Detect module style
        if (code.includes('import ') && code.includes('from ')) {
          updateOrAddPref('imports', 'import_style', 'ESM imports (import/export)');
        } else if (code.includes('require(') || code.includes('module.exports')) {
          updateOrAddPref('imports', 'import_style', 'CommonJS require/exports');
        }

        // 2. Detect style styling library
        if (code.includes('className="') || code.includes('className={')) {
          if (code.includes('bg-') || code.includes('text-') || code.includes('flex ')) {
            updateOrAddPref('styling', 'styling_library', 'Tailwind CSS utility utility classes');
          }
        } else if (code.includes('styled.div') || code.includes('styled(')) {
          updateOrAddPref('styling', 'styling_library', 'Styled Components / CSS-in-JS');
        } else if (code.includes('style={{') && code.includes('display:')) {
          updateOrAddPref('styling', 'styling_library', 'Inline CSS styling');
        }

        // 3. Detect state approach
        if (code.includes('create(') && code.includes('zustand')) {
          updateOrAddPref('state', 'state_library', 'Zustand global stores');
        } else if (code.includes('useState(')) {
          updateOrAddPref('state', 'state_library', 'React useState local hook state');
        }

        // 4. Detect component type
        if (code.includes('const ') && code.includes(' = () =>') && (code.includes('return (') || code.includes('return <'))) {
          updateOrAddPref('patterns', 'component_style', 'Arrow function stateless React components');
        }

        set({ preferences: nextPrefs });
      },

      getStyleContext: () => {
        const { preferences, isLearningEnabled } = get();
        if (!isLearningEnabled || preferences.length === 0) return '';

        const lines = ['Observed User Coding Style Guidelines:'];
        preferences
          .filter(p => p.confidence >= 0.5)
          .forEach(p => {
            lines.push(`  - [${p.category.toUpperCase()}] Prefer ${p.value} (${Math.round(p.confidence * 100)}% observed confidence)`);
          });

        return lines.join('\n');
      }
    }),
    {
      name: 'nexo-ai-learning-v1',
      partialize: (state) => ({
        preferences: state.preferences,
        isLearningEnabled: state.isLearningEnabled
      })
    }
  )
);
