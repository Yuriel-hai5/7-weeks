import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sevenweeks.app',
  appName: '7周蜕变',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
