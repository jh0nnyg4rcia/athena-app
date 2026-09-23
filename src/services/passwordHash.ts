import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

const BCRYPT_ROUNDS = 12;

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const ALL = UPPER + LOWER + DIGITS;

/** Senha temporária com letra, número e tamanho fixo. Não é gravada em lugar nenhum. */
export function generateTemporaryPassword(length = 16): string {
  const chars = [
    UPPER[randomInt(UPPER.length)],
    LOWER[randomInt(LOWER.length)],
    DIGITS[randomInt(DIGITS.length)]
  ];
  while (chars.length < length) chars.push(ALL[randomInt(ALL.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const swap = chars[i];
    chars[i] = chars[j];
    chars[j] = swap;
  }
  return chars.join('');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!password || !passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}
