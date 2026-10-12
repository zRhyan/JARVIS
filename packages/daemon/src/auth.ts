// packages/daemon/src/auth.ts

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDataDir } from './paths.js';

/** Gera um token aleatório de 32 bytes (hex) e o persiste em auth.token (0600). */
export function generateAndSaveToken(dataDir: string): string {
  ensureDataDir(dataDir);
  const token = randomBytes(32).toString('hex');
  const file = join(dataDir, 'auth.token');
  writeFileSync(file, token, { encoding: 'utf-8', mode: 0o600 });
  if (process.platform !== 'win32') chmodSync(file, 0o600);
  return token;
}

export function verifyBearer(header: string | undefined, token: string): boolean {
  if (!header || !header.startsWith('Bearer ')) return false;
  const provided = Buffer.from(header.slice(7).trim());
  const expected = Buffer.from(token);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

export function isLoopbackRequest(ip: string | undefined, hostHeader: string | undefined): boolean {
  return !!ip && LOOPBACK_IPS.has(ip) && !!hostHeader && LOCAL_HOST_RE.test(hostHeader);
}
