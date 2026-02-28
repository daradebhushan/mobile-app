import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nagar.parishad.app',
  appName: 'Loknagar',
  webDir: 'www',
  server: {
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    }
  }
};

export default config;
