import { DeploymentProvider, getProviderDefinition } from './providers';

export type DeploymentPlan = {
  provider: DeploymentProvider;
  env: Record<string, string>;
  buildConfig: string;
  deployScript: string;
  checklist: string[];
};

export function generateDeploymentPlan(provider: DeploymentProvider): DeploymentPlan {
  const definition = getProviderDefinition(provider);
  const env = Object.fromEntries(definition.requiredEnv.map((key) => [key, key.startsWith('VITE_') ? 'https://api.example.com' : '']));

  return {
    provider,
    env,
    buildConfig: [
      `provider=${definition.name}`,
      `config=${definition.configFile}`,
      `build=${definition.buildCommand}`,
      `output=${definition.outputDirectory}`,
    ].join('\n'),
    deployScript: `npm run build && npm run deploy:${provider}`,
    checklist: [
      'Validate environment variables',
      'Run production build',
      'Upload static assets',
      'Attach API/runtime service if provider supports it',
      'Run post-deploy smoke test',
    ],
  };
}
