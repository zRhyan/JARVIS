// packages/daemon/src/profile-repo.ts

import type { JarvisDB } from './db.js';

export interface Profile {
  id: string;
  name: string;
  vaultPath: string;
  model: string;
  apiKey?: string | null;
  isActive: boolean;
}

export interface PublicProfile extends Omit<Profile, 'apiKey'> {
  apiKey: string | null; // sempre mascarada
}

export interface ProfilesFile {
  activeProfileId?: string | null;
  profiles: Array<{ id: string; name: string; vaultPath: string; model: string; apiKey?: string | null }>;
}

export function maskApiKey(key?: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return '****';
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export function toPublic(p: Profile): PublicProfile {
  return { ...p, apiKey: maskApiKey(p.apiKey) };
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'perfil';
}

function rowToProfile(r: any): Profile {
  return {
    id: r.id,
    name: r.name,
    vaultPath: r.vault_path,
    model: r.model,
    apiKey: r.api_key,
    isActive: !!r.is_active
  };
}

export class ProfileRepository {
  constructor(private db: JarvisDB) {}

  list(): Profile[] {
    return this.db.prepare('SELECT * FROM profiles ORDER BY created_at, id').all().map(rowToProfile);
  }

  get(id: string): Profile | undefined {
    const r = this.db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);
    return r ? rowToProfile(r) : undefined;
  }

  getActive(): Profile | undefined {
    const r = this.db.prepare('SELECT * FROM profiles WHERE is_active = 1').get();
    return r ? rowToProfile(r) : undefined;
  }

  create(input: { id?: string; name: string; vaultPath: string; model: string; apiKey?: string | null }): Profile {
    let id = input.id || slugify(input.name);
    if (!input.id) {
      const base = id;
      let n = 2;
      while (this.get(id)) id = `${base}-${n++}`;
    } else if (this.get(id)) {
      throw new Error(`Perfil "${id}" já existe.`);
    }
    this.db
      .prepare('INSERT INTO profiles (id, name, vault_path, model, api_key) VALUES (?, ?, ?, ?, ?)')
      .run(id, input.name, input.vaultPath, input.model, input.apiKey ?? null);
    // O primeiro perfil criado torna-se ativo automaticamente
    if (!this.getActive()) this.setActive(id);
    return this.get(id)!;
  }

  setActive(id: string): Profile {
    if (!this.get(id)) throw new Error(`Perfil "${id}" não encontrado.`);
    const tx = this.db.transaction(() => {
      this.db.prepare('UPDATE profiles SET is_active = 0').run();
      this.db.prepare('UPDATE profiles SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
    });
    tx();
    return this.get(id)!;
  }

  update(id: string, patch: { name?: string; vaultPath?: string; model?: string; apiKey?: string | null }): Profile {
    const existing = this.get(id);
    if (!existing) throw new Error(`Perfil "${id}" não encontrado.`);
    const name = typeof patch.name === 'string' && patch.name.trim() ? patch.name.trim() : existing.name;
    const vaultPath = typeof patch.vaultPath === 'string' && patch.vaultPath.trim() ? patch.vaultPath.trim() : existing.vaultPath;
    const model = typeof patch.model === 'string' && patch.model.trim() ? patch.model.trim() : existing.model;
    const apiKey = patch.apiKey !== undefined ? patch.apiKey : existing.apiKey;
    this.db.prepare(
      'UPDATE profiles SET name = ?, vault_path = ?, model = ?, api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, vaultPath, model, apiKey, id);
    return this.get(id)!;
  }

  exportJson(): ProfilesFile {
    const all = this.list();
    return {
      activeProfileId: all.find((p) => p.isActive)?.id ?? null,
      profiles: all.map((p) => ({ id: p.id, name: p.name, vaultPath: p.vaultPath, model: p.model, apiKey: p.apiKey ?? null }))
    };
  }

  /** Importa perfis (upsert por id). Retorna a quantidade importada. */
  importJson(data: ProfilesFile): number {
    if (!data || !Array.isArray(data.profiles)) throw new Error('JSON inválido: campo "profiles" ausente.');
    const upsert = this.db.prepare(`
      INSERT INTO profiles (id, name, vault_path, model, api_key) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, vault_path = excluded.vault_path,
        model = excluded.model, api_key = excluded.api_key, updated_at = CURRENT_TIMESTAMP
    `);
    const tx = this.db.transaction(() => {
      for (const p of data.profiles) {
        if (!p.id || !p.name || !p.vaultPath || !p.model) throw new Error(`Perfil inválido no JSON: ${JSON.stringify(p.id ?? p)}`);
        upsert.run(p.id, p.name, p.vaultPath, p.model, p.apiKey ?? null);
      }
    });
    tx();
    if (data.activeProfileId && this.get(data.activeProfileId)) this.setActive(data.activeProfileId);
    else if (!this.getActive() && data.profiles[0]) this.setActive(data.profiles[0].id);
    return data.profiles.length;
  }
}
