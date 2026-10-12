// packages/daemon/src/main.ts

import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import { join } from 'node:path';
import { resolveDataDir } from './paths.js';
import { openDatabase } from './db.js';
import { generateAndSaveToken } from './auth.js';
import { ProfileRepository } from './profile-repo.js';
import { buildServer } from './server.js';

dotenv.config();

async function main() {
  const dataDir = resolveDataDir();
  const db = openDatabase(dataDir);
  const token = generateAndSaveToken(dataDir);

  // Bootstrap: primeira execução usando as variáveis do .env existentes
  const profiles = new ProfileRepository(db);
  if (profiles.list().length === 0 && (process.env.VAULT_PATH || process.env.OPENROUTER_API_KEY)) {
    profiles.create({
      id: 'default',
      name: 'Perfil Padrão',
      vaultPath: resolve(process.env.VAULT_PATH || join(process.cwd(), 'default-vault')),
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
      apiKey: process.env.OPENROUTER_API_KEY || null
    });
    console.log('[JARVIS] Perfil "default" criado a partir do .env.');
  }

  const port = parseInt(process.env.JARVIS_PORT || '4173', 10);
  const app = await buildServer({ db, token, logger: false });
  await app.listen({ host: '127.0.0.1', port });

  console.log(`[JARVIS] Daemon ativo em http://127.0.0.1:${port}`);
  console.log(`[JARVIS] Dados: ${dataDir}`);
  console.log(`[JARVIS] Token de autenticação: ${join(dataDir, 'auth.token')}`);

  const shutdown = async () => {
    await app.close();
    db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[JARVIS] Falha ao iniciar o daemon:', err);
  process.exit(1);
});
