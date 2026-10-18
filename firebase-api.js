import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, setPersistence, inMemoryPersistence, signInAnonymously, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

export async function createFirebaseApi() {
  const env = import.meta.env;
  const emulator = env.VITE_USE_EMULATORS === 'true';
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY || (emulator ? 'demo-key' : ''),
    projectId: env.VITE_FIREBASE_PROJECT_ID || (emulator ? 'demo-daisy-sounds' : ''),
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (emulator ? 'demo-daisy-sounds.firebaseapp.com' : ''),
    appId: env.VITE_FIREBASE_APP_ID || (emulator ? 'demo-app' : '')
  };
  if (Object.values(config).some(value => !value)) throw new Error('Firebase is not configured yet. Use fictional demo mode until setup is complete.');
  if (emulator && (!config.projectId.startsWith('demo-') || !['localhost', '127.0.0.1'].includes(location.hostname))) throw new Error('Emulators are limited to a local demo project.');
  const app = initializeApp(config);
  if (!emulator) {
    if (!env.VITE_FIREBASE_APPCHECK_SITE_KEY) throw new Error('Configure Firebase App Check before using an online classroom.');
    initializeAppCheck(app, { provider: new ReCaptchaV3Provider(env.VITE_FIREBASE_APPCHECK_SITE_KEY), isTokenAutoRefreshEnabled: true });
  }
  const auth = getAuth(app);
  await setPersistence(auth, inMemoryPersistence);
  const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION || 'us-central1');
  if (emulator) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFunctionsEmulator(functions, '127.0.0.1', 5001); }
  const call = async (name, data = {}) => (await httpsCallable(functions, name)(data)).data;
  return {
    demo: false,
    async login(email, password) { await signOut(auth); await signInWithEmailAndPassword(auth, email, password); },
    async logout() { await signOut(auth); },
    async verification() { if (auth.currentUser && !auth.currentUser.isAnonymous) await sendEmailVerification(auth.currentUser); },
    async reset(email) { await sendPasswordResetEmail(auth, email); },
    async dashboard() { if (auth.currentUser) await auth.currentUser.getIdToken(true); return call('getDashboard'); },
    rotate: () => call('rotateClassCode'),
    manage: data => call('manageStudents', data),
    async join(code) { if (!auth.currentUser?.isAnonymous) { await signOut(auth); await signInAnonymously(auth); } return call('joinClass', { code }); },
    select: studentId => call('selectStudent', { studentId }),
    begin: () => call('beginRun'),
    answer: data => call('recordAnswer', data),
    finish: runId => call('finishRun', { runId })
  };
}
