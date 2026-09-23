import firebaseConfig from '../../firebase-applet-config.json';
import { normalizeEmail, sanitizeDisplayName, validatePassword } from '../lib/authPolicy';
import { canSendAuthMail, sendAccessEmail } from './authMailer';
import { generateTemporaryPassword, hashPassword, verifyPassword } from './passwordHash';

const API_KEY = (process.env.FIREBASE_WEB_API_KEY || firebaseConfig.apiKey || '').trim();
const DATABASE_ID = firebaseConfig.firestoreDatabaseId;

export class AuthFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

type AdminAuth = {
  createUser: (props: Record<string, unknown>) => Promise<{ uid: string }>;
  updateUser: (uid: string, props: Record<string, unknown>) => Promise<unknown>;
  deleteUser: (uid: string) => Promise<void>;
  getUserByEmail: (email: string) => Promise<{ uid: string; displayName?: string }>;
  verifyIdToken: (token: string) => Promise<{
    uid: string;
    email?: string;
    name?: string;
    email_verified?: boolean;
    firebase?: { sign_in_provider?: string };
  }>;
};

type AdminDb = {
  collection: (name: string) => {
    doc: (id: string) => {
      set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<unknown>;
      get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
    };
  };
};

let adminReady: Promise<{ auth: AdminAuth; db: AdminDb } | null> | null = null;

async function loadAdmin(): Promise<{ auth: AdminAuth; db: AdminDb } | null> {
  if (!adminReady) {
    adminReady = (async () => {
      try {
        const appMod = await import('firebase-admin/app');
        const authMod = await import('firebase-admin/auth');
        const dbMod = await import('firebase-admin/firestore');
        const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp();
        return {
          auth: authMod.getAuth(app) as unknown as AdminAuth,
          db: dbMod.getFirestore(app, DATABASE_ID) as unknown as AdminDb
        };
      } catch (error) {
        console.warn('[ATHENA Auth] Admin SDK indisponível neste processo.');
        return null;
      }
    })();
  }
  return adminReady;
}

async function identityPost(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!API_KEY) throw new AuthFlowError('Não foi possível concluir a autenticação.');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = String((data.error as { message?: string } | undefined)?.message || '');
    if (message.includes('EMAIL_EXISTS')) throw new AuthFlowError('EMAIL_EXISTS');
    if (message.includes('INVALID_LOGIN_CREDENTIALS') || message.includes('EMAIL_NOT_FOUND') || message.includes('INVALID_PASSWORD')) {
      throw new AuthFlowError('INVALID_LOGIN');
    }
    if (message.includes('TOO_MANY_ATTEMPTS')) throw new AuthFlowError('TOO_MANY');
    throw new AuthFlowError('AUTH_FAILED');
  }
  return data;
}

async function storePasswordHash(uid: string, email: string, password: string): Promise<void> {
  const admin = await loadAdmin();
  if (!admin) return;
  const passwordHash = await hashPassword(password);
  await admin.db.collection('auth_secrets').doc(uid).set({
    passwordHash,
    email,
    updatedAt: Date.now()
  }, { merge: true });
}

async function assertStoredHash(uid: string, email: string, password: string): Promise<void> {
  const admin = await loadAdmin();
  if (!admin) return;
  const snap = await admin.db.collection('auth_secrets').doc(uid).get();
  const hash = snap.exists ? String(snap.data()?.passwordHash || '') : '';
  if (!hash) {
    await storePasswordHash(uid, email, password);
    return;
  }
  const ok = await verifyPassword(password, hash);
  if (!ok) throw new AuthFlowError('INVALID_LOGIN');
}

async function clearPasswordHash(uid: string): Promise<void> {
  const admin = await loadAdmin();
  if (!admin) return;
  await admin.db.collection('auth_secrets').doc(uid).set({
    passwordHash: '',
    updatedAt: Date.now()
  }, { merge: true });
}

async function createAccount(email: string, password: string, name: string): Promise<{ uid: string; idToken?: string }> {
  const admin = await loadAdmin();
  if (admin) {
    try {
      const user = await admin.auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
        disabled: false
      });
      return { uid: user.uid };
    } catch (error) {
      const code = String((error as { code?: string })?.code || '');
      if (code.includes('email-already-exists')) throw new AuthFlowError('EMAIL_EXISTS');
      throw new AuthFlowError('AUTH_FAILED');
    }
  }

  const created = await identityPost('accounts:signUp', {
    email,
    password,
    returnSecureToken: true
  });
  const idToken = String(created.idToken || '');
  const uid = String(created.localId || '');
  if (!uid || !idToken) throw new AuthFlowError('AUTH_FAILED');
  await identityPost('accounts:update', { idToken, displayName: name }).catch(() => undefined);
  return { uid, idToken };
}

async function deleteAccount(uid: string, idToken?: string): Promise<void> {
  const admin = await loadAdmin();
  if (admin) {
    await admin.auth.deleteUser(uid).catch(() => undefined);
    return;
  }
  if (idToken) {
    await identityPost('accounts:delete', { idToken }).catch(() => undefined);
  }
}

export async function registerEmailAccount(input: {
  name: unknown;
  email: unknown;
  password?: unknown;
}): Promise<{ emailSent: boolean }> {
  const email = normalizeEmail(input.email);
  const name = sanitizeDisplayName(input.name);
  if (!email || !name) throw new AuthFlowError('Dados de cadastro inválidos.');

  const provided = typeof input.password === 'string' && input.password.length > 0;
  if (provided) {
    const problem = validatePassword(input.password, email);
    if (problem) throw new AuthFlowError(problem);
  }
  const password = provided ? String(input.password) : generateTemporaryPassword();
  const created = await createAccount(email, password, name);

  try {
    await storePasswordHash(created.uid, email, password);
    if (!canSendAuthMail()) {
      if (!provided) {
        await deleteAccount(created.uid, created.idToken);
        throw new AuthFlowError('Não foi possível enviar a senha por e-mail. Tente de novo mais tarde.');
      }
      return { emailSent: false };
    }
    await sendAccessEmail({ kind: 'welcome', name, email, password });
    return { emailSent: true };
  } catch (error) {
    if (error instanceof AuthFlowError) throw error;
    if (!provided) await deleteAccount(created.uid, created.idToken);
    if (!provided) throw new AuthFlowError('Não foi possível enviar a senha por e-mail. Tente de novo mais tarde.');
    return { emailSent: false };
  }
}

export async function loginEmailAccount(input: { email: unknown; password: unknown }): Promise<void> {
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  if (!email || !password) throw new AuthFlowError('INVALID_LOGIN');

  const signed = await identityPost('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true
  });
  const uid = String(signed.localId || '');
  if (uid) await assertStoredHash(uid, email, password);
}

export async function resetEmailAccess(input: { email: unknown }): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email) return;

  const admin = await loadAdmin();
  if (!admin || !canSendAuthMail()) {
    if (admin) {
      try {
        const user = await admin.auth.getUserByEmail(email);
        await clearPasswordHash(user.uid);
      } catch {
        /* a resposta continua igual quando o e-mail não existe */
      }
    }
    await identityPost('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email }).catch(() => undefined);
    return;
  }

  try {
    const user = await admin.auth.getUserByEmail(email);
    const password = generateTemporaryPassword();
    await admin.auth.updateUser(user.uid, { password });
    await storePasswordHash(user.uid, email, password);
    await sendAccessEmail({
      kind: 'reset',
      name: user.displayName || 'Aluno',
      email,
      password
    });
  } catch (error) {
    const code = String((error as { code?: string })?.code || '');
    if (code.includes('user-not-found')) return;
    console.warn('[ATHENA Auth] Falha ao redefinir acesso.');
  }
}

export async function verifyGoogleSession(idToken: string): Promise<{
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}> {
  const token = idToken.trim();
  if (!token || token.length > 5000) throw new AuthFlowError('AUTH_FAILED');

  const admin = await loadAdmin();
  let uid = '';
  let email = '';
  let name = '';
  let verified = false;
  let provider = '';

  if (admin) {
    try {
      const decoded = await admin.auth.verifyIdToken(token);
      uid = decoded.uid;
      email = String(decoded.email || '').toLowerCase();
      name = String(decoded.name || '');
      verified = Boolean(decoded.email_verified);
      provider = String(decoded.firebase?.sign_in_provider || '');
    } catch {
      throw new AuthFlowError('AUTH_FAILED');
    }
  } else {
    const lookup = await identityPost('accounts:lookup', { idToken: token });
    const user = Array.isArray(lookup.users) ? lookup.users[0] as Record<string, unknown> : null;
    if (!user) throw new AuthFlowError('AUTH_FAILED');
    uid = String(user.localId || '');
    email = String(user.email || '').toLowerCase();
    name = String(user.displayName || '');
    verified = Boolean(user.emailVerified);
    const providers = Array.isArray(user.providerUserInfo) ? user.providerUserInfo as Array<Record<string, unknown>> : [];
    provider = String(providers[0]?.providerId || '');
  }

  if (!uid || !normalizeEmail(email)) throw new AuthFlowError('AUTH_FAILED');
  if (provider && provider !== 'google.com' && provider !== 'password') {
    throw new AuthFlowError('AUTH_FAILED');
  }

  const displayName = sanitizeDisplayName(name) || 'Aluno ATHENA';
  if (admin) {
    await admin.db.collection('users').doc(uid).set({
      displayName,
      email,
      provider: provider || 'google.com',
      updatedAt: Date.now()
    }, { merge: true });
  }

  return { uid, email, displayName, emailVerified: verified };
}

const PUBLIC_AUTH_MESSAGES = new Set([
  'Não foi possível concluir o cadastro. Se você já tem conta, entre ou peça uma nova senha.',
  'E-mail ou senha incorretos.',
  'Não foi possível enviar a senha por e-mail. Tente de novo mais tarde.',
  'Dados de cadastro inválidos.',
  'Informe uma senha.',
  'A senha precisa ter entre 10 e 72 caracteres.',
  'A senha precisa ter letras e números.',
  'A senha não pode conter o e-mail.',
  'Muitas tentativas. Aguarde um pouco e tente novamente.'
]);

export function publicAuthMessage(error: unknown): string {
  if (error instanceof AuthFlowError) {
    if (error.message === 'EMAIL_EXISTS') {
      return 'Não foi possível concluir o cadastro. Se você já tem conta, entre ou peça uma nova senha.';
    }
    if (error.message === 'INVALID_LOGIN') return 'E-mail ou senha incorretos.';
    if (error.message === 'TOO_MANY') return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
    if (PUBLIC_AUTH_MESSAGES.has(error.message)) return error.message;
  }
  return 'Não foi possível concluir a autenticação. Tente novamente.';
}
