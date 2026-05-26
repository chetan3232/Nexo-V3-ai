export type DeploymentProvider = 'vercel' | 'netlify' | 'cloudflare' | 'railway';

export type ProviderDefinition = {
  id: DeploymentProvider;
  name: string;
  configFile: string;
  buildCommand: string;
  outputDirectory: string;
  requiredEnv: string[];
};

export const deploymentProviders: ProviderDefinition[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    configFile: 'vercel.json',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    requiredEnv: ['VITE_NEXO_API_URL'],
  },
  {
    id: 'netlify',
    name: 'Netlify',
    configFile: 'netlify.toml',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    requiredEnv: ['VITE_NEXO_API_URL'],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Pages',
    configFile: 'wrangler.toml',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    requiredEnv: ['VITE_NEXO_API_URL'],
  },
  {
    id: 'railway',
    name: 'Railway',
    configFile: 'railway.json',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    requiredEnv: ['NEXO_API_PORT', 'NEXO_WORKSPACE_ROOT'],
  },
];

export function getProviderDefinition(provider: DeploymentProvider) {
  return deploymentProviders.find((item) => item.id === provider) ?? deploymentProviders[0];
}
