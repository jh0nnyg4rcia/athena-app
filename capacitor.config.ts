import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athena.mentoria',
  appName: 'ATHENA - Mentoria Jurídica',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    FirebaseAuthentication: {
      // true: o plugin devolve o idToken do Google para o Firebase JS SDK (WebView Capacitor).
      skipNativeAuth: true,
      providers: ['google.com'],
      authDomain: 'athena-mentoria.firebaseapp.com'
    }
  }
};

export default config;
