import nodemailer from 'nodemailer';
import { escapeHtml } from '../lib/authPolicy';

export type AccessMail =
  | { kind: 'welcome'; name: string; email: string; password: string }
  | { kind: 'reset'; name: string; email: string; password: string };

function smtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = process.env.SMTP_PASS || '';
  const from = (process.env.SMTP_FROM || user).trim();
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass || !from) return null;
  return { host, user, pass, from, port };
}

export function canSendAuthMail(): boolean {
  return smtpConfig() !== null;
}

export async function sendAccessEmail(mail: AccessMail): Promise<void> {
  const smtp = smtpConfig();
  if (!smtp) {
    throw new Error('MAIL_UNAVAILABLE');
  }
  const safeName = escapeHtml(mail.name);
  const safeEmail = escapeHtml(mail.email);
  const safePassword = escapeHtml(mail.password);
  const intro = mail.kind === 'welcome'
    ? 'Sua conta na ATHENA foi criada. Use a senha temporária abaixo para entrar. Ela vale só para o primeiro acesso.'
    : 'Recebemos um pedido para redefinir o acesso da sua conta ATHENA. Use a nova senha temporária abaixo.';

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass }
  });

  await transporter.sendMail({
    from: smtp.from,
    to: mail.email,
    subject: mail.kind === 'welcome' ? 'Seu acesso à ATHENA' : 'Nova senha temporária da ATHENA',
    text: `${mail.name},\n\n${intro}\n\nE-mail: ${mail.email}\nSenha temporária: ${mail.password}\n\nSe você não pediu isso, ignore esta mensagem.\n`,
    html: `<p>${safeName},</p><p>${escapeHtml(intro)}</p><p>E-mail: <strong>${safeEmail}</strong><br>Senha temporária: <strong>${safePassword}</strong></p><p>Se você não pediu isso, ignore esta mensagem.</p>`
  });
}
