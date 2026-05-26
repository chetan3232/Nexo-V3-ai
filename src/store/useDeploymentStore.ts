import { create } from 'zustand';
import { generateDeploymentPlan, DeploymentPlan } from '@/deploy/deploymentEngine';
import { DeploymentProvider } from '@/deploy/providers';

type DeploymentStatus = 'idle' | 'generating' | 'building' | 'deploying' | 'success' | 'error';

type DeploymentState = {
  provider: DeploymentProvider;
  status: DeploymentStatus;
  plan: DeploymentPlan;
  logs: string[];
  setProvider: (provider: DeploymentProvider) => void;
  runDeployment: () => Promise<void>;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  provider: 'vercel',
  status: 'idle',
  plan: generateDeploymentPlan('vercel'),
  logs: [],
  setProvider: (provider) => set({ provider, plan: generateDeploymentPlan(provider), status: 'idle', logs: [] }),
  runDeployment: async () => {
    const { provider } = get();
    set({ status: 'generating', plan: generateDeploymentPlan(provider), logs: ['generating env, build config, and deploy script'] });
    await wait(350);
    set((state) => ({ status: 'building', logs: [...state.logs, `building with ${state.plan.deployScript.split('&&')[0].trim()}`] }));
    await wait(450);
    set((state) => ({ status: 'deploying', logs: [...state.logs, `deploying to ${provider}`] }));
    await wait(450);
    set((state) => ({ status: 'success', logs: [...state.logs, 'deployment handoff ready'] }));
  },
}));
