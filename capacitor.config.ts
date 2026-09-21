import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.royalchat.app',
  appName: 'Royal Chat',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
