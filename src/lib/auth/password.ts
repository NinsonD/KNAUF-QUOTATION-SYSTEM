import crypto from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(crypto.pbkdf2);
const ITERATIONS = 220000;
const KEY_LEN = 64;
function parts(stored: string) {
  const fields = stored.split('$');
  const legacy = !stored.includes('$');
  const [salt, hash] = legacy ? stored.split(':') : fields.slice(2);
  const rounds = legacy ? 100000 : Number(fields[1]);
  if ((!legacy && (fields.length !== 4 || fields[0] !== 'pbkdf2-sha512')) || !/^[a-f0-9]{32}$/i.test(salt ?? '') || !/^[a-f0-9]{128}$/i.test(hash ?? '') || !Number.isInteger(rounds) || rounds < 100000 || rounds > 1000000) return null;
  return { salt, hash, rounds };
}
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  return `pbkdf2-sha512$${ITERATIONS}$${salt}$${crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, 'sha512').toString('hex')}`;
}
export async function hashPasswordAsync(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return `pbkdf2-sha512$${ITERATIONS}$${salt}$${(await derive(password, salt, ITERATIONS, KEY_LEN, 'sha512')).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const value = parts(stored); if (!value) return false;
  return crypto.timingSafeEqual(Buffer.from(value.hash, 'hex'), crypto.pbkdf2Sync(password, value.salt, value.rounds, KEY_LEN, 'sha512'));
}
export async function verifyPasswordAsync(password: string, stored: string): Promise<boolean> {
  const value = parts(stored); if (!value) return false;
  const result = await derive(password, value.salt, value.rounds, KEY_LEN, 'sha512');
  if (value.rounds < ITERATIONS) await derive(password, 'authentication-timing-padding', ITERATIONS - value.rounds, KEY_LEN, 'sha512');
  return crypto.timingSafeEqual(Buffer.from(value.hash, 'hex'), result);
}
export function passwordNeedsRehash(stored: string): boolean { return !stored.startsWith(`pbkdf2-sha512$${ITERATIONS}$`); }
