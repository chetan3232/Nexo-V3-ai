import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.nexo.v3',
  appName: 'NEXO V3',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
