const deploymentProviders = {
  vercel: { configFile: 'vercel.json', buildCommand: 'npm run build', outputDirectory: 'dist' },
  netlify: { configFile: 'netlify.toml', buildCommand: 'npm run build', outputDirectory: 'dist' },
  cloudflare: { configFile: 'wrangler.toml', buildCommand: 'npm run build', outputDirectory: 'dist' },
  railway: { configFile: 'railway.json', buildCommand: 'npm run build', outputDirectory: 'dist' },
};

/**
 * Creates configuration and triggers deploy simulation.
 */
export async function triggerDeployment(provider, onLog) {
  const definition = deploymentProviders[provider] ?? deploymentProviders.vercel;
  onLog(`[deploy] triggering build for provider: ${provider.toUpperCase()}`);
  onLog(`[deploy] using configuration: ${definition.configFile}`);
  onLog(`[deploy] running build command: "${definition.buildCommand}"`);

  // Simulate deployment progress
  await new Promise((resolve) => setTimeout(resolve, 1500));
  onLog('[deploy] bundling files...');
  await new Promise((resolve) => setTimeout(resolve, 1500));
  onLog('[deploy] pushing static assets to edge server network...');
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  const randomId = Math.random().toString(36).slice(2, 8);
  const targetUrl = `https://nexo-v3-${randomId}.${provider}.app`;
  onLog(`[deploy] success! project live at: ${targetUrl}`);

  return {
    success: true,
    url: targetUrl,
    logs: `Build completed successfully. Config matches ${definition.configFile}.`
  };
}
