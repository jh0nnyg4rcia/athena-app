/** Regras de entrada da autenticação. Sem segredo e sem acesso a banco. */

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length < 6 || email.length > 200 || !EMAIL_RE.test(email)) return null;
  return email;
}

/** Remove marcação que poderia ir para HTML, e-mail ou perfil. */
export function sanitizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value
    .replace(/[<>"'`\\]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (name.length < 3 || name.length > 80) return null;
  return name;
}

export function validatePassword(password: unknown, email?: string): string | null {
  if (typeof password !== 'string') return 'Informe uma senha.';
  if (password.length < 10 || password.length > 72) {
    return 'A senha precisa ter entre 10 e 72 caracteres.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'A senha precisa ter letras e números.';
  }
  if (email && password.toLowerCase().includes(email.toLowerCase())) {
    return 'A senha não pode conter o e-mail.';
  }
  return null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
