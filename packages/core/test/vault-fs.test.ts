// packages/core/test/vault-fs.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolve, join } from 'node:path';
import { mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { VaultFSSandbox } from '../src/vault-fs.js';
import { PathTraversalError, ProtectedPathError } from '../src/errors.js';

describe('VaultFSSandbox', () => {
  const FIXTURES_DIR = resolve(__dirname, 'fixtures', 'test-vault');
  const OUTSIDE_DIR = resolve(__dirname, 'fixtures', 'outside-vault');
  let sandbox: VaultFSSandbox;

  beforeEach(async () => {
    // Cria um ambiente limpo de vault para cada teste
    await rm(FIXTURES_DIR, { recursive: true, force: true });
    await rm(OUTSIDE_DIR, { recursive: true, force: true });
    
    await mkdir(FIXTURES_DIR, { recursive: true });
    await mkdir(OUTSIDE_DIR, { recursive: true });
    
    // Arquivo secreto fora do cofre para simular invasão
    await writeFile(join(OUTSIDE_DIR, 'secret.txt'), 'DADOS SENSIVEIS');

    sandbox = new VaultFSSandbox(FIXTURES_DIR);
  });

  afterEach(async () => {
    // Limpeza após os testes
    await rm(FIXTURES_DIR, { recursive: true, force: true });
    await rm(OUTSIDE_DIR, { recursive: true, force: true });
  });

  it('T01: Deve bloquear Path Traversal clássico', () => {
    expect(() => sandbox.resolveSafePath('../outside-vault/secret.txt'))
      .toThrow(PathTraversalError);
    
    expect(() => sandbox.resolveSafePath('../../etc/passwd'))
      .toThrow(PathTraversalError);
  });

  it('T03: Deve bloquear acesso a pastas restritas', () => {
    expect(() => sandbox.resolveSafePath('.git/config'))
      .toThrow(ProtectedPathError);
      
    expect(() => sandbox.resolveSafePath('.obsidian/app.json'))
      .toThrow(ProtectedPathError);
      
    expect(() => sandbox.resolveSafePath('pasta/.jarvis/config.json'))
      .toThrow(ProtectedPathError);
  });

  it('T02: Deve bloquear tentativas baseadas em caminhos absolutos forjados', () => {
    const absolutOut = resolve(OUTSIDE_DIR, 'secret.txt');
    expect(() => sandbox.resolveSafePath(absolutOut))
      .toThrow(PathTraversalError);
  });

  it('T04 & T05 & T06: Deve escrever atomicamente, normalizar CRLF para LF e garantir Hash determinístico', async () => {
    const targetPath = 'notas/minha-nota.md';
    const windowsContent = "Linha 1\r\nLinha 2\r\nLinha 3";
    const expectedLinuxContent = "Linha 1\nLinha 2\nLinha 3";

    // Escreve atômicamente (CRLF)
    const writeResult = await sandbox.writeAtomic(targetPath, windowsContent);
    
    // Verifica conteúdo normalizado retornado
    expect(writeResult.content).toBe(expectedLinuxContent);

    // Lê do disco para confirmar a persistência
    const readResult = await sandbox.readNote(targetPath);
    
    // Deterministmo
    expect(readResult.content).toBe(expectedLinuxContent);
    expect(readResult.contentHash).toBe(writeResult.contentHash);
    expect(readResult.relativePath).toBe('notas/minha-nota.md');
  });

  it('T07: Deve criar toda a árvore de diretórios automaticamente antes da escrita', async () => {
    const deepPath = 'muito/profundo/para/esta/nova/nota.md';
    
    await sandbox.writeAtomic(deepPath, '# Sucesso');
    const result = await sandbox.readNote(deepPath);
    
    expect(result.content).toBe('# Sucesso');
  });

  it('Deve listar apenas arquivos .md permitidos', async () => {
    await sandbox.writeAtomic('nota1.md', 'teste');
    await sandbox.writeAtomic('pasta/nota2.md', 'teste');
    
    // Cria pasta protegida com arquivos e arquivo não md
    await mkdir(join(FIXTURES_DIR, '.git'), { recursive: true });
    await writeFile(join(FIXTURES_DIR, '.git', 'config'), 'teste');
    await writeFile(join(FIXTURES_DIR, 'imagem.png'), 'blob');

    const files = await sandbox.listMarkdownFiles();
    
    expect(files).toHaveLength(2);
    expect(files).toContain('nota1.md');
    expect(files).toContain('pasta/nota2.md');
  });
});