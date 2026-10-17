// packages/daemon/src/server.ts

import Fastify, { type FastifyInstance } from 'fastify';
import { existsSync, createReadStream, statSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type OpenAI from 'openai';
import { JarvisAgent, buildSystemPrompt, type ToolCallbacks } from './agent-loop.js';
import { initVaultContext, type VaultContext } from './vault-context.js';
import { VaultWatcherService } from './vault-watcher.js';
import { ToolExecutor } from './tool-executor.js';
import { verifyBearer, isLoopbackRequest } from './auth.js';
import type { JarvisDB } from './db.js';
import { ProfileRepository, toPublic, type Profile } from './profile-repo.js';
import { SessionRepository, type NewMessage } from './session-repo.js';
import { ProposalStateManager, ProposalStateError, type ProposalStatus } from './proposal-manager.js';

export interface AgentLike {
  execute(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    toolExecutor: ToolExecutor,
    callbacks?: ToolCallbacks
  ): AsyncGenerator<OpenAI.Chat.Completions.ChatCompletionChunk, void, unknown>;
}

export type AgentFactory = (profile: Profile, ctx: VaultContext, apiKey: string) => AgentLike;
export type VaultLoader = (vaultPath: string) => Promise<VaultContext>;

export interface ServerOptions {
  db: JarvisDB;
  token: string;
  agentFactory?: AgentFactory;
  vaultLoader?: VaultLoader;
  logger?: boolean;
}

const defaultAgentFactory: AgentFactory = (profile: any, ctx, apiKey) =>
  new JarvisAgent({
    apiKey,
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    model: profile.model,
    reasoningEffort: profile.reasoningEffort || 'low',
    vaultConventions: ctx.vaultConventions
  });

const ALLOWED_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export async function buildServer(opts: ServerOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? false });
  const profiles = new ProfileRepository(opts.db);
  const sessions = new SessionRepository(opts.db);
  const proposals = new ProposalStateManager(opts.db);
  const agentFactory = opts.agentFactory ?? defaultAgentFactory;
  const vaultLoader = opts.vaultLoader ?? ((p: string) => initVaultContext(p));
  const startedAt = Date.now();

  // Contexto do cofre do perfil ativo (carregado sob demanda e cacheado)
  let activeCtx: { profileId: string; vaultPath: string; ctx: VaultContext } | null = null;

  async function getActiveContext(): Promise<{ profile: Profile; ctx: VaultContext }> {
    const profile = profiles.getActive();
    if (!profile) throw httpError(409, 'Nenhum perfil ativo. Crie um perfil via POST /api/profiles.');
    if (!activeCtx || activeCtx.profileId !== profile.id || activeCtx.vaultPath !== profile.vaultPath) {
      if (activeCtx?.ctx.watcher) {
        await activeCtx.ctx.watcher.close();
      }
      const ctx = await vaultLoader(profile.vaultPath);
      if (!ctx.watcher) {
        const watcher = new VaultWatcherService(ctx);
        watcher.start();
        ctx.watcher = watcher;
      }
      activeCtx = { profileId: profile.id, vaultPath: profile.vaultPath, ctx };
    }
    return { profile, ctx: activeCtx.ctx };
  }

  app.addHook('onClose', async () => {
    if (activeCtx?.ctx.watcher) {
      await activeCtx.ctx.watcher.close();
    }
  });

  // ---- Segurança: loopback, CORS restrito e Bearer token ----
  app.addHook('onRequest', async (req, reply) => {
    if (!isLoopbackRequest(req.ip, req.headers.host)) {
      return reply.code(403).send({ error: 'Apenas acesso local (127.0.0.1) é permitido.' });
    }
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGIN_RE.test(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
    }
    if (req.method === 'OPTIONS') return reply.code(204).send();

    // Rotas estáticas (HTML/CSS/JS da Web UI) não exigem Bearer token; apenas /api/* é protegido
    if (!req.url.startsWith('/api')) {
      return;
    }

    if (!verifyBearer(req.headers.authorization, opts.token)) {
      return reply.code(401).send({ error: 'Token de autenticação ausente ou inválido.' });
    }
  });

  // Registra servidor de arquivos estáticos nativo da SPA Web se o build existir
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const webDist = resolve(__dirname, '../../web/dist');

  const getMimeType = (filePath: string) => {
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
    if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
    if (filePath.endsWith('.svg')) return 'image/svg+xml';
    if (filePath.endsWith('.json')) return 'application/json';
    if (filePath.endsWith('.png')) return 'image/png';
    return 'application/octet-stream';
  };

  if (existsSync(webDist)) {
    app.get('/*', async (req, reply) => {
      if (req.url.startsWith('/api')) {
        return reply.code(404).send({ error: 'Endpoint não encontrado.' });
      }
      const rawPath = req.url.split('?')[0];
      const safeRel = rawPath === '/' ? 'index.html' : rawPath.replace(/^\//, '');
      const candidate = resolve(webDist, safeRel);
      if (candidate.startsWith(webDist) && existsSync(candidate) && !statSync(candidate).isDirectory()) {
        reply.header('Content-Type', getMimeType(candidate));
        return reply.send(createReadStream(candidate));
      }
      const indexPath = resolve(webDist, 'index.html');
      if (existsSync(indexPath)) {
        reply.header('Content-Type', 'text/html; charset=utf-8');
        reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        const html = readFileSync(indexPath, 'utf-8');
        const injectedScript = `<script>window.__JARVIS_BOOTSTRAP_TOKEN__ = ${JSON.stringify(opts.token)};</script>`;
        const modifiedHtml = html.includes('</head>')
          ? html.replace('</head>', `${injectedScript}</head>`)
          : `${injectedScript}${html}`;
        return reply.send(modifiedHtml);
      }
      return reply.code(404).send({ error: 'Arquivo não encontrado.' });
    });
  }

  app.setErrorHandler((err: any, _req, reply) => {
    const status = err.statusCode && err.statusCode >= 400 ? err.statusCode : err instanceof ProposalStateError ? 409 : 500;
    reply.code(status).send({ error: err.message });
  });

  // ---- Health ----
  app.get('/api/health', async () => {
    const active = profiles.getActive();
    let vaultStats = null;
    if (active) {
      try {
        const { ctx } = await getActiveContext();
        vaultStats = ctx.watcher ? ctx.watcher.getStats() : {
          indexedNotes: ctx.graph.getAllNodes().length,
          lastSyncAt: null
        };
      } catch {
        // Ignora caso não consiga carregar o cofre no momento
      }
    }
    return {
      status: 'ok',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      activeProfile: active ? toPublic(active) : null,
      vault: vaultStats
    };
  });

  // ---- Perfis ----
  app.get('/api/profiles', async () => ({ profiles: profiles.list().map(toPublic) }));

  app.post('/api/profiles', async (req, reply) => {
    const b = (req.body ?? {}) as any;
    for (const f of ['name', 'vaultPath', 'model']) {
      if (typeof b[f] !== 'string' || !b[f].trim()) throw httpError(400, `Campo "${f}" é obrigatório.`);
    }
    try {
      const p = profiles.create({ id: b.id, name: b.name.trim(), vaultPath: b.vaultPath.trim(), model: b.model.trim(), apiKey: b.apiKey });
      reply.code(201);
      return toPublic(p);
    } catch (e: any) {
      throw httpError(409, e.message);
    }
  });

  app.post('/api/profiles/:id/activate', async (req) => {
    const { id } = req.params as { id: string };
    const target = profiles.get(id);
    if (!target) throw httpError(404, `Perfil "${id}" não encontrado.`);
    
    // Encerra watcher do perfil anterior, se houver
    if (activeCtx?.ctx.watcher) {
      await activeCtx.ctx.watcher.close();
    }

    // Reinicializa cofre e grafo; só efetiva a troca se o cofre carregar com sucesso
    const ctx = await vaultLoader(target.vaultPath);
    if (!ctx.watcher) {
      const watcher = new VaultWatcherService(ctx);
      watcher.start();
      ctx.watcher = watcher;
    }

    const active = profiles.setActive(id);
    activeCtx = { profileId: active.id, vaultPath: active.vaultPath, ctx };
    return { activeProfile: toPublic(active), indexedNotes: ctx.graph.getAllNodes().length };
  });

  app.patch('/api/profiles/:id', async (req) => {
    const { id } = req.params as { id: string };
    if (!profiles.get(id)) throw httpError(404, `Perfil "${id}" não encontrado.`);
    const b = (req.body ?? {}) as any;
    const updated = profiles.update(id, {
      name: b.name,
      vaultPath: b.vaultPath,
      model: b.model,
      apiKey: b.apiKey
    });
    return toPublic(updated);
  });

  // ---- Sessões ----
  app.get('/api/sessions', async (req) => {
    const active = profiles.getActive();
    if (!active) return { sessions: [] };
    const q = req.query as any;
    const limit = Math.min(Math.max(parseInt(q.limit ?? '50', 10) || 50, 1), 200);
    const offset = Math.max(parseInt(q.offset ?? '0', 10) || 0, 0);
    return { sessions: sessions.listByProfile(active.id, limit, offset) };
  });

  app.post('/api/sessions', async (req, reply) => {
    const active = profiles.getActive();
    if (!active) throw httpError(409, 'Nenhum perfil ativo.');
    const b = (req.body ?? {}) as any;
    reply.code(201);
    return sessions.create(active.id, typeof b.title === 'string' && b.title.trim() ? b.title.trim() : undefined);
  });

  app.get('/api/sessions/:id', async (req) => {
    const { id } = req.params as { id: string };
    const s = sessions.get(id);
    if (!s) throw httpError(404, 'Sessão não encontrada.');
    return { session: s, messages: sessions.getMessages(id) };
  });

  app.delete('/api/sessions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!sessions.delete(id)) throw httpError(404, 'Sessão não encontrada.');
    reply.code(204);
  });

  // ---- Chat (SSE) ----
  app.post('/api/chat', async (req, reply) => {
    const b = (req.body ?? {}) as any;
    if (typeof b.message !== 'string' || !b.message.trim()) throw httpError(400, 'Campo "message" é obrigatório.');

    const { profile, ctx } = await getActiveContext();
    const apiKey = profile.apiKey || process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) throw httpError(400, 'Perfil sem apiKey e OPENROUTER_API_KEY não definida.');

    let session = b.sessionId ? sessions.get(b.sessionId) : undefined;
    if (b.sessionId && !session) throw httpError(404, 'Sessão não encontrada.');
    if (session && session.profileId !== profile.id) throw httpError(409, 'A sessão pertence a outro perfil.');
    const isNew = !session;
    if (!session) session = sessions.create(profile.id, b.message.trim().slice(0, 60));
    const sessionId = session.id;

    // Reconstrói o histórico para o LLM
    const history = sessions.getMessages(sessionId);
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt(ctx.vaultConventions) }
    ];
    for (const m of history) {
      if (m.role === 'assistant') {
        messages.push({ role: 'assistant', content: m.content || null, ...(m.toolCalls ? { tool_calls: m.toolCalls } : {}) } as any);
      } else if (m.role === 'tool') {
        messages.push({ role: 'tool', tool_call_id: m.toolCallId ?? '', content: m.content });
      } else if (m.role === 'user') {
        messages.push({ role: 'user', content: m.content });
      }
    }
    const baseLen = messages.length;
    messages.push({ role: 'user', content: b.message });

    // Abre o stream SSE
    reply.hijack();
    const raw = reply.raw;
    const origin = req.headers.origin;
    raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      ...(origin && ALLOWED_ORIGIN_RE.test(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {})
    });
    const send = (event: string, data: unknown) => raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('session', { sessionId, isNew });

    let finalText = '';
    const pendingArgs: any[] = [];
    const createdProposalsInTurn: string[] = [];
    const callbacks: ToolCallbacks = {
      onToolStart: (name, args) => {
        pendingArgs.push(args);
        send('tool_start', { tool: name, args });
      },
      onToolEnd: (name, result) => {
        pendingArgs.shift();
        send('tool_end', { tool: name, isSuccess: result.isSuccess, error: result.error });
        if (name === 'propose_block_replace' && result.isSuccess && result.data?.status === 'PENDING') {
          const p = proposals.create({
            sessionId,
            notePath: result.data.path,
            baseHash: result.data.baseHash,
            searchBlock: result.data.searchBlock,
            replaceBlock: result.data.replaceBlock,
            unifiedDiff: result.data.unifiedDiff ?? ''
          });
          createdProposalsInTurn.push(p.id);
          send('proposal', p);
        }
      }
    };

    try {
      const executor = new ToolExecutor(ctx); // sem onApproval: propostas ficam PENDING
      const modelToUse = typeof b.model === 'string' && b.model.trim() ? b.model.trim() : profile.model;
      const reasoningEffort = b.reasoningEffort || b.thinking_level?.toLowerCase() || 'low';
      const agentProfile = { ...profile, model: modelToUse, reasoningEffort };
      const agent = agentFactory(agentProfile, ctx, apiKey);
      for await (const chunk of agent.execute(messages, executor, callbacks)) {
        const text = chunk.choices?.[0]?.delta?.content || '';
        if (text) {
          finalText += text;
          send('token', { text });
        }
      }
      messages.push({ role: 'assistant', content: finalText });
      send('done', { sessionId });
    } catch (e: any) {
      send('error', { message: e.message });
      if (!finalText) {
        finalText = `⚠️ **Ocorreu um erro durante o processamento:** ${e.message || 'Erro desconhecido'}`;
        send('token', { text: finalText });
      }
      messages.push({ role: 'assistant', content: finalText });
    } finally {
      // Persiste tudo o que foi gerado nesta rodada (inclui chamadas de ferramenta)
      const toSave: NewMessage[] = [];
      for (const m of messages.slice(baseLen) as any[]) {
        toSave.push({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : m.content == null ? '' : JSON.stringify(m.content),
          toolCalls: m.tool_calls ?? null,
          toolCallId: m.tool_call_id ?? null
        });
      }
      if (toSave.length) {
        const inserted = sessions.appendMessages(sessionId, toSave);
        // Vincula o message_id do assistente a todas as propostas emitidas nesta rodada
        const assistantMsg = inserted.find((m) => m.role === 'assistant');
        if (assistantMsg && createdProposalsInTurn.length > 0) {
          const updateStmt = opts.db.prepare('UPDATE proposals SET message_id = ? WHERE id = ?');
          for (const propId of createdProposalsInTurn) {
            updateStmt.run(assistantMsg.id, propId);
          }
        }
      }
      raw.end();
    }
  });

  // ---- Propostas ----
  app.get('/api/proposals', async (req) => {
    const q = req.query as any;
    const active = profiles.getActive();
    const status = q.status ? (String(q.status).toUpperCase() as ProposalStatus) : undefined;
    if (status && !['PENDING', 'APPLIED', 'REJECTED', 'STALE'].includes(status)) throw httpError(400, 'Status inválido.');
    return { proposals: proposals.list({ status, sessionId: q.sessionId, profileId: active?.id }) };
  });

  app.post('/api/proposals/:id/approve', async (req) => {
    const { id } = req.params as { id: string };
    const p = proposals.get(id);
    if (!p) throw httpError(404, 'Proposta não encontrada.');
    const { profile, ctx } = await getActiveContext();
    const session = sessions.get(p.sessionId);
    if (session && session.profileId !== profile.id) throw httpError(409, 'A proposta pertence a outro perfil. Ative-o primeiro.');
    const result = await proposals.approve(id, ctx);
    return { proposal: result };
  });

  app.post('/api/proposals/:id/reject', async (req) => {
    const { id } = req.params as { id: string };
    if (!proposals.get(id)) throw httpError(404, 'Proposta não encontrada.');
    return { proposal: proposals.reject(id) };
  });

  return app;
}

function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  const e = new Error(message) as Error & { statusCode: number };
  e.statusCode = statusCode;
  return e;
}
