// packages/daemon/src/profiles-cli.ts
// Uso: npm run profiles -w @jarvis/daemon -- export [arquivo] | import <arquivo> | list

import { readFileSync, writeFileSync } from 'node:fs';
import { resolveDataDir } from './paths.js';
import { openDatabase } from './db.js';
import { ProfileRepository, toPublic } from './profile-repo.js';

const [cmd, file] = process.argv.slice(2);
const db = openDatabase(resolveDataDir());
const repo = new ProfileRepository(db);

try {
  switch (cmd) {
    case 'export': {
      const json = JSON.stringify(repo.exportJson(), null, 2);
      if (file) {
        writeFileSync(file, json, { encoding: 'utf-8', mode: 0o600 });
        console.log(`Perfis exportados para ${file}`);
      } else {
        console.log(json);
      }
      break;
    }
    case 'import': {
      if (!file) throw new Error('Informe o arquivo JSON: import <arquivo>');
      const n = repo.importJson(JSON.parse(readFileSync(file, 'utf-8')));
      console.log(`${n} perfil(is) importado(s).`);
      break;
    }
    case 'list':
      console.log(JSON.stringify(repo.list().map(toPublic), null, 2));
      break;
    default:
      console.log('Uso: profiles <export [arquivo] | import <arquivo> | list>');
      process.exitCode = 1;
  }
} catch (e: any) {
  console.error('Erro:', e.message);
  process.exitCode = 1;
} finally {
  db.close();
}
