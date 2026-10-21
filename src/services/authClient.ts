import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { sanitizeDisplayName, validatePassword, normalizeEmail } from '../lib/authPolicy';
import { auth, db, logOut } from '../lib/firebase';
import { getApiUrl } from './geminiService';

const SAFE_MESSAGES = [
  'E-mail ou senha incorretos.',
  'Não foi possível concluir o cadastro. Se você já tem conta, entre ou peça uma nova senha.',
  'Não foi possível enviar a senha por e-mail. Tente de novo mais tarde.',
  'Não foi possível excluir a conta agora. Tente de novo mais tarde.',
  'Dados de cadastro inválidos.',
  'Informe uma senha.',
  'A senha precisa ter entre 10 e 72 caracteres.',
  'A senha precisa ter letras e números.',
  'A senha não pode conter o e-mail.',
  'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'Muitas requisições. Tente novamente em instantes.',
  'Não foi possível concluir a autenticação.',
  'Não foi possível concluir a autenticação. Tente novamente.',
  'O login com o Google foi cancelado.',
  'A janela do Google foi fechada antes de concluir o login. Se você não cancelou, pode haver uma falha de autenticação.',
  'Não foi possível entrar com o Google por uma configuração de autenticação. Informe o erro ao suporte.',
  'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.',
  'Sem conexão. Verifique a internet e tente novamente.'
];

export function publicClientAuthError(error: unknown): string {
  const code = String((error as { code?: string })?.code || '');
  const message = error instanceof Error ? error.message : '';
  if (['redirect_uri_mismatch', 'auth/redirect-uri-mismatch', 'auth/invalid-oauth-client-id', 'auth/unauthorized-domain', 'auth/operation-not-allowed'].includes(code)
    || message.includes('redirect_uri_mismatch')) {
    return 'Não foi possível entrar com o Google por uma configuração de autenticação. Informe o erro ao suporte.';
  }
  // A closed popup also occurs after provider errors; it does not prove human cancellation.
  if (code === 'auth/popup-closed-by-user') {
    return 'A janela do Google foi fechada antes de concluir o login. Se você não cancelou, pode haver uma falha de autenticação.';
  }
  if (['canceled', 'cancelled', 'auth/canceled', 'auth/cancelled'].includes(code)) {
    return 'O login com o Google foi cancelado.';
  }
  if (code.includes('popup-blocked')) {
    return 'O navegador bloqueou a janela do Google. Permita pop-ups e tente de novo.';
  }
  if (code.includes('network-request-failed')) {
    return 'Sem conexão. Verifique a internet e tente novamente.';
  }
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'E-mail ou senha incorretos.';
  }
  if (code.includes('too-many-requests')) {
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  }
  return SAFE_MESSAGES.includes(message) ? message : 'Não foi possível concluir a autenticação. Tente novamente.';
}

async function postAuth<T>(endpoint: string, body: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('Sem conexão. Verifique a internet e tente novamente.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const raw = typeof data?.error === 'string' ? data.error : '';
    throw new Error(SAFE_MESSAGES.includes(raw) ? raw : 'Não foi possível concluir a autenticação.');
  }
  return data as T;
}

async function syncProfile(user: User, name?: string): Promise<void> {
  const email = normalizeEmail(user.email || '');
  if (!email) return;
  const displayName = sanitizeDisplayName(name || user.displayName || '') || 'Aluno ATHENA';
  try {
    await setDoc(doc(db, 'users', user.uid), {
      displayName,
      email
    }, { merge: true });
  } catch (err) {
    console.warn('[ATHENA Auth] Sincronização secundária de perfil ignorada (não-bloqueante):', err);
  }
}

async function confirmServerSession(user: User, name?: string): Promise<void> {
  const token = await user.getIdToken();
  await postAuth('/api/auth/session', {}, token);
  await syncProfile(user, name);
}

export async function registerAccount(input: { name: string; email: string; password?: string }): Promise<{ emailSent: boolean; delivery: 'password' | 'link' | 'none' }> {
  const email = normalizeEmail(input.email);
  const name = sanitizeDisplayName(input.name);
  if (!email || !name) throw new Error('Dados de cadastro inválidos.');
  if (input.password) {
    const problem = validatePassword(input.password, email);
    if (problem) throw new Error(problem);
  }
  const result = await postAuth<{ emailSent?: boolean; delivery?: 'password' | 'link' | 'none' }>('/api/auth/register', {
    name,
    email,
    password: input.password || ''
  });
  const delivery = result.delivery === 'password' || result.delivery === 'link' ? result.delivery : 'none';
  return { emailSent: Boolean(result.emailSent), delivery };
}

export async function loginWithEmail(emailRaw: string, password: string): Promise<User> {
  const email = normalizeEmail(emailRaw);
  if (!email || !password) throw new Error('E-mail ou senha incorretos.');
  await postAuth('/api/auth/login', { email, password });
  try {
    const signed = await signInWithEmailAndPassword(auth, email, password);
    try {
      await confirmServerSession(signed.user);
    } catch (sessionErr) {
      console.warn('[ATHENA Auth] Falha ao confirmar sessão no servidor:', sessionErr);
    }
    return signed.user;
  } catch (error) {
    const errCode = (error as { code?: string })?.code;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[ATHENA Auth] Falha no signInWithEmailAndPassword do cliente:', { code: errCode, message: errMsg });
    if (errCode === 'auth/wrong-password' || errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
      await logOut().catch(() => undefined);
    }
    throw error;
  }
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  let signedUser: User;
  try {
    if (Capacitor.isNativePlatform()) {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      const native = await FirebaseAuthentication.signInWithGoogle();
      const idToken = native.credential?.idToken;
      const accessToken = native.credential?.accessToken;
      if (!idToken && !accessToken) throw new Error('Não foi possível concluir a autenticação.');
      const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
      const signed = await signInWithCredential(auth, credential);
      signedUser = signed.user;
    } else {
      const signed = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      signedUser = signed.user;
    }
    try {
      await confirmServerSession(signedUser);
    } catch (sessionErr) {
      console.warn('[ATHENA Auth] Falha ao confirmar sessão Google no servidor:', sessionErr);
    }
    return signedUser;
  } catch (error) {
    const errCode = (error as { code?: string })?.code;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[ATHENA Auth] Falha no login Google do cliente:', { code: errCode, message: errMsg });
    if (errCode === 'auth/unauthorized-domain' || errCode === 'auth/operation-not-allowed') {
      await logOut().catch(() => undefined);
    }
    throw error;
  }
}

export function clearLocalAccountData(uid: string): void {
  try {
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === 'athena_local_user' || key === 'athena_registered_students') {
        drop.push(key);
      } else if (uid && key.startsWith('athena_') && key.includes(uid)) {
        drop.push(key);
      }
    }
    drop.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage indisponível */
  }
  try {
    // O cofre athena_lesson_vault guarda o catálogo oficial e não é apagado aqui.
    indexedDB.deleteDatabase('athena_offline_cache');
  } catch {
    /* indexedDB indisponível */
  }
}

export async function deleteCurrentAccount(): Promise<void> {
  const current = auth.currentUser;
  if (!current) throw new Error('Não foi possível concluir a autenticação.');
  const token = await current.getIdToken();
  await postAuth('/api/auth/delete-account', {}, token);
  clearLocalAccountData(current.uid);
}

export async function requestNewPassword(emailRaw: string): Promise<void> {
  const email = normalizeEmail(emailRaw);
  if (!email) throw new Error('Dados de cadastro inválidos.');
  await postAuth('/api/auth/forgot', { email });
}
