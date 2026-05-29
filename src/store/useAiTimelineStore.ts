import { create } from 'zustand';

export type TimelineEvent = {
  id: string;
  timestamp: number;
  agentId: string;
  icon: string; // e.g., '🧠', '⚡', '🐞', '🛡️'
  title: string;
  detail: string;
  status: 'pending' | 'success' | 'failed' | 'info';
};

type AiTimelineState = {
  events: TimelineEvent[];
  addEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  clearTimeline: () => void;
};

export const useAiTimelineStore = create<AiTimelineState>((set) => ({
  events: [],
  addEvent: (event) => set((s) => ({
    events: [
      ...s.events,
      {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: Date.now(),
      }
    ]
  })),
  clearTimeline: () => set({ events: [] }),
}));
