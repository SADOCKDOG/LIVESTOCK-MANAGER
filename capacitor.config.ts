import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.livestockmanager.app.manual',
  appName: 'Livestock Manager',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  android: {
    webContentsDebuggingEnabled: true,
    backgroundColor: '#000000'
  },
  plugins: {
    EdgeToEdge: {
      backgroundColor: '#000000'
    }
  }
};

export default config;
