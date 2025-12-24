import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zootecnia.caprino',
  appName: 'Gestión Caprino',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      ios: {
        cameraUsageDescription: 'La aplicación necesita acceso a la cámara para tomar fotos de los animales y escanear códigos QR'
      },
      android: {
        permissions: ['CAMERA']
      }
    },
    Network: {
      android: {
        permissions: ['ACCESS_NETWORK_STATE']
      }
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#16a34a',
      showSpinner: false
    }
  }
};

export default config;
