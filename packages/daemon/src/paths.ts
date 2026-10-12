// packages/daemon/src/paths.ts

import { join } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';

/**
 * Resolve o diretório de dados do JARVIS:
 * 1. JARVIS_DATA_DIR (override para testes/ambientes customizados)
 * 2. Windows: %APPDATA%\jarvis
 * 3. Demais: ~/.config/jarvis
 */
export function resolveDataDir(env: NodeJS.ProcessEnv = process.env, platform: NodeJS.Platform = process.platform): string {
  if (env.JARVIS_DATA_DIR && env.JARVIS_DATA_DIR.trim() !== '') {
    return env.JARVIS_DATA_DIR;
  }
  if (platform === 'win32' && env.APPDATA) {
    return join(env.APPDATA, 'jarvis');
  }
  return join(homedir(), '.config', 'jarvis');
}

export function ensureDataDir(dir: string): string {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}
