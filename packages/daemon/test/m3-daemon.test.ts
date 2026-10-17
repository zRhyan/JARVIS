// packages/daemon/test/m3-daemon.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, type JarvisDB } from '../src/db.js';
import { ProfileRepository, maskApiKey } from '../src/profile-repo.js';
import { SessionRepository } from '../src/session-repo.js';
import { ProposalStateManager } from '../src/proposal-manager.js';
import { generateAndSaveToken, verifyBearer } from '../src/auth.js';
import { resolveDataDir } from '../src/paths.js';
import { initVaultContext } from '../src/vault-context.js';
import { buildServer, type AgentFactory } from '../src/server.js';

let tmp: string;
let vault: string;
let db: JarvisDB;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'jarvis-m3-'));
  vault = join(tmp, 'vault');
  mkdirSync(vault);
  writeFileSync(join(vault, 'nota.md'), '# Nota\n\nTexto original.\n');
  db = openDatabase(tmp, true);
});

afterEach(() => {
  db.close();
  rmSync(tmp, { recursive: true, force: true });
});

describe('paths', () => {
  it('respeita JARVIS_DATA_DIR e padrões por SO', () => {
    expect(resolveDataDir({ JARVIS_DATA_DIR: '/x' } as any)).toBe('/x');
    expect(resolveDataDir({ APPDATA: 'C:\\Users\\a\\AppData\\Roaming' } as any, 'win32')).toContain('jarvis');
    expect(resolveDataDir({} as any, 'linux')).toMatch(/\.config[\\/]jarvis$/);
  });
});

describe('ProfileRepository', () => {
  it('cria, ativa, exporta e importa perfis', () => {
    const repo = new ProfileRepository(db);
    const a = repo.create({ name: 'Aviônica KM', vaultPath: '/a', model: 'm1', apiKey: 'sk-or-v1-abcdefghij' });
    expect(a.id).toBe('avionica-km');
    expect(a.isActive).toBe(true); // primeiro vira ativo
    const b = repo.create({ name: 'Pessoal', vaultPath: '/b', model: 'm2' });
    repo.setActive(b.id);
    expect(repo.getActive()?.id).toBe('pessoal');

    const json = repo.exportJson();
    expect(json.activeProfileId).toBe('pessoal');
    expect(json.profiles).toHaveLength(2);

    const db2 = openDatabase(tmp, true);
    const repo2 = new ProfileRepository(db2);
    expect(repo2.importJson(json)).toBe(2);
    expect(repo2.getActive()?.id).toBe('pessoal');
    expect(repo2.get('avionica-km')?.apiKey).toBe('sk-or-v1-abcdefghij');
    db2.close();
  });

  it('mascara a chave de API', () => {
    expect(maskApiKey('sk-or-v1-abcdefghij')).toBe('sk-or-…ghij');
    expect(maskApiKey(null)).toBeNull();
  });
});

describe('SessionRepository', () => {
  it('persiste mensagens com ordem e cascade ao deletar perfil', () => {
    const profiles = new ProfileRepository(db);
    const p = profiles.create({ name: 'P', vaultPath: vault, model: 'm' });
    const repo = new SessionRepository(db);
    const s = repo.create(p.id, 'T');
    repo.appendMessages(s.id, [
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: '', toolCalls: [{ id: '1', type: 'function', function: { name: 'x', arguments: '{}' } }] },
      { role: 'tool', content: '{}', toolCallId: '1' }
    ]);
    repo.appendMessages(s.id, [{ role: 'assistant', content: 'ok' }]);
    const msgs = repo.getMessages(s.id);
    expect(msgs.map((m) => m.role)).toEqual(['user', 'assistant', 'tool', 'assistant']);
    expect(msgs[1].toolCalls?.[0].id).toBe('1');
    db.prepare('DELETE FROM profiles WHERE id = ?').run(p.id);
    expect(repo.getMessages(s.id)).toHaveLength(0);
  });
});

describe('ProposalStateManager', () => {
  async function setup() {
    const profiles = new ProfileRepository(db);
    const p = profiles.create({ name: 'P', vaultPath: vault, model: 'm' });
    const s = new SessionRepository(db).create(p.id);
    const ctx = await initVaultContext(vault);
    const note = await ctx.sandbox.readNote('nota.md');
    const mgr = new ProposalStateManager(db);
    const prop = mgr.create({
      sessionId: s.id,
      notePath: 'nota.md',
      baseHash: note.contentHash,
      searchBlock: 'Texto original.',
      replaceBlock: 'Texto alterado.',
      unifiedDiff: 'diff'
    });
    return { mgr, prop, ctx };
  }

  it('aprova e grava em disco (APPLIED)', async () => {
    const { mgr, prop, ctx } = await setup();
    const res = await mgr.approve(prop.id, ctx);
    expect(res.status).toBe('APPLIED');
    expect(readFileSync(join(vault, 'nota.md'), 'utf-8')).toContain('Texto alterado.');
    await expect(mgr.approve(prop.id, ctx)).rejects.toThrow(/já resolvida/);
  });

  it('marca STALE se a nota mudou e não escreve', async () => {
    const { mgr, prop, ctx } = await setup();
    writeFileSync(join(vault, 'nota.md'), '# Nota\n\nEditada externamente.\n');
    const res = await mgr.approve(prop.id, ctx);
    expect(res.status).toBe('STALE');
    expect(readFileSync(join(vault, 'nota.md'), 'utf-8')).toContain('Editada externamente.');
  });

  it('rejeita (REJECTED)', async () => {
    const { mgr, prop } = await setup();
    expect(mgr.reject(prop.id).status).toBe('REJECTED');
  });

  it('realiza rebase automático de propostas pendentes subsequentes para a mesma nota', async () => {
    const { mgr, prop, ctx } = await setup();
    // Cria uma segunda proposta pendente para a mesma nota (adicionando ao final do arquivo)
    const currentNote = await ctx.sandbox.readNote('nota.md');
    const prop2 = mgr.create({
      sessionId: prop.sessionId,
      notePath: 'nota.md',
      baseHash: currentNote.contentHash, // mesmo baseHash inicial
      searchBlock: '$END',
      replaceBlock: '## Segunda seção adicionada.',
      unifiedDiff: '+## Segunda seção adicionada.'
    });

    // Aprova a primeira proposta
    const res1 = await mgr.approve(prop.id, ctx);
    expect(res1.status).toBe('APPLIED');

    // Verifica que a prop2 foi rebaseada e NÃO virou STALE prematuramente
    const updatedProp2 = mgr.get(prop2.id);
    expect(updatedProp2?.status).toBe('PENDING');
    expect(updatedProp2?.baseHash).not.toBe(currentNote.contentHash); // baseHash atualizado

    // Agora aprova a segunda proposta com sucesso
    const res2 = await mgr.approve(prop2.id, ctx);
    expect(res2.status).toBe('APPLIED');

    // Confirma que ambas as edições foram consolidadas no arquivo final
    const finalContent = readFileSync(join(vault, 'nota.md'), 'utf-8');
    expect(finalContent).toContain('Texto alterado.');
    expect(finalContent).toContain('## Segunda seção adicionada.');
  });
});

describe('Auth', () => {
  it('gera token 0600 e valida Bearer', () => {
    const t = generateAndSaveToken(tmp);
    expect(t).toHaveLength(64);
    if (process.platform !== 'win32') expect(statSync(join(tmp, 'auth.token')).mode & 0o777).toBe(0o600);
    expect(verifyBearer(`Bearer ${t}`, t)).toBe(true);
    expect(verifyBearer('Bearer errado', t)).toBe(false);
    expect(verifyBearer(undefined, t)).toBe(false);
  });
});

describe('API HTTP', () => {
  const TOKEN = 'a'.repeat(64);
  const auth = { authorization: `Bearer ${TOKEN}` };

  // Agente falso: emite uma proposta e depois a resposta final
  const fakeAgent: AgentFactory = () => ({
    async *execute(messages, executor, cb) {
      const args = { path: 'nota.md', search_block: 'Texto original.', replace_block: 'Via API.' };
      cb?.onToolStart?.('propose_block_replace', args);
      const r = await executor.execute('propose_block_replace', args);
      cb?.onToolEnd?.('propose_block_replace', r);
      yield { choices: [{ delta: { content: 'Proposta ' } }] } as any;
      yield { choices: [{ delta: { content: 'criada.' } }] } as any;
    }
  });

  async function app() {
    return buildServer({ db, token: TOKEN, agentFactory: fakeAgent });
  }

  it('exige token', async () => {
    const a = await app();
    expect((await a.inject({ method: 'GET', url: '/api/health' })).statusCode).toBe(401);
    expect((await a.inject({ method: 'GET', url: '/api/health', headers: { authorization: 'Bearer x' } })).statusCode).toBe(401);
    expect((await a.inject({ method: 'GET', url: '/api/health', headers: auth })).statusCode).toBe(200);
    await a.close();
  });

  it('bloqueia Host não-local', async () => {
    const a = await app();
    const r = await a.inject({ method: 'GET', url: '/api/health', headers: { ...auth, host: 'evil.com' } });
    expect(r.statusCode).toBe(403);
    await a.close();
  });

  it('fluxo completo: perfil -> chat SSE -> proposta -> aprovar', async () => {
    const a = await app();
    const created = await a.inject({
      method: 'POST', url: '/api/profiles', headers: auth,
      payload: { name: 'Teste', vaultPath: vault, model: 'm', apiKey: 'sk-or-v1-secretsecret' }
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().apiKey).not.toContain('secretsecret');

    const act = await a.inject({ method: 'POST', url: '/api/profiles/teste/activate', headers: auth });
    expect(act.statusCode).toBe(200);
    expect(act.json().indexedNotes).toBeGreaterThan(0);

    const chat = await a.inject({ method: 'POST', url: '/api/chat', headers: auth, payload: { message: 'altere a nota' } });
    expect(chat.statusCode).toBe(200);
    expect(chat.headers['content-type']).toContain('text/event-stream');
    expect(chat.body).toContain('event: token');
    expect(chat.body).toContain('event: proposal');
    expect(chat.body).toContain('event: done');

    const pend = (await a.inject({ method: 'GET', url: '/api/proposals?status=pending', headers: auth })).json().proposals;
    expect(pend).toHaveLength(1);
    expect(readFileSync(join(vault, 'nota.md'), 'utf-8')).toContain('Texto original.'); // intacto até aprovar

    const ok = await a.inject({ method: 'POST', url: `/api/proposals/${pend[0].id}/approve`, headers: auth });
    expect(ok.json().proposal.status).toBe('APPLIED');
    expect(readFileSync(join(vault, 'nota.md'), 'utf-8')).toContain('Via API.');

    const again = await a.inject({ method: 'POST', url: `/api/proposals/${pend[0].id}/approve`, headers: auth });
    expect(again.statusCode).toBe(409);

    const sessionsList = (await a.inject({ method: 'GET', url: '/api/sessions', headers: auth })).json().sessions;
    expect(sessionsList).toHaveLength(1);
    const full = (await a.inject({ method: 'GET', url: `/api/sessions/${sessionsList[0].id}`, headers: auth })).json();
    expect(full.messages.map((m: any) => m.role)).toEqual(['user', 'assistant']);
    expect(full.messages[1].content).toBe('Proposta criada.');

    expect((await a.inject({ method: 'DELETE', url: `/api/sessions/${sessionsList[0].id}`, headers: auth })).statusCode).toBe(204);
    await a.close();
  });

  it('rejeita proposta via API', async () => {
    const a = await app();
    await a.inject({ method: 'POST', url: '/api/profiles', headers: auth, payload: { name: 'T', vaultPath: vault, model: 'm', apiKey: 'k' } });
    await a.inject({ method: 'POST', url: '/api/chat', headers: auth, payload: { message: 'x' } });
    const pend = (await a.inject({ method: 'GET', url: '/api/proposals?status=PENDING', headers: auth })).json().proposals;
    const rej = await a.inject({ method: 'POST', url: `/api/proposals/${pend[0].id}/reject`, headers: auth });
    expect(rej.json().proposal.status).toBe('REJECTED');
    await a.close();
  });

  it('serve SPA estática na raiz sem exigir token', async () => {
    const a = await app();
    const res = await a.inject({ method: 'GET', url: '/' });
    expect(res.statusCode).toBe(200);
    expect(res.payload).toContain('JARVIS — Obsidian AI Copilot');
    await a.close();
  });
});
