import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grupoemanuel.app',
  appName: 'GrupoEmanuel',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    App: {
      customURLScheme: 'grupoemanuel',
    },
  },
};

export default config;
