import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const required = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_APPCHECK_SITE_KEY'];
if (env.VITE_APP_MODE !== 'firebase' || env.VITE_USE_EMULATORS === 'true' || required.some(key => !env[key]) || env.VITE_FIREBASE_PROJECT_ID.startsWith('demo-')) {
  console.error('Hosting stopped: configure the Firebase app, App Check, and production mode first. Demo/emulator builds must not be deployed as a real classroom.');
  process.exit(1);
}
