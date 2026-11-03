// packages/core/test/epistemic-uri.test.ts

import { describe, it, expect } from 'vitest';
import {
  MMTUriResolver,
  DEFAULT_DOC_URI,
  UNASSIGNED_DOMAIN,
  type VaultNoteSymbolInfo
} from '../src/epistemic-uri.js';

describe('Sub-etapa 3.1: MMTUriResolver & VaultSymbolResolver', () => {
  describe('parseCanonical', () => {
    it('analisa corretamente URIs tripartidos canônicos com espaços, hífens e acentos UTF-8', () => {
      const parsed = MMTUriResolver.parseCanonical(
        'jarvis://vault?Mecânica Clássica?Def - Força Centrípeta'
      );

      expect(parsed.doc).toBe('jarvis://vault');
      expect(parsed.mod).toBe('Mecânica Clássica');
      expect(parsed.sym).toBe('Def - Força Centrípeta');
      expect(parsed.theoryUri).toBe('jarvis://vault?Mecânica Clássica');
      expect(parsed.canonical).toBe(
        'jarvis://vault?Mecânica Clássica?Def - Força Centrípeta'
      );
    });

    it('suporta caminhos hierárquicos aninhados com barras em mod e sym', () => {
      const parsed = MMTUriResolver.parseCanonical(
        'jarvis://vault///?Matemática / Álgebra / Grupos?mult / mon / Identidade'
      );

      expect(parsed.doc).toBe('jarvis://vault');
      expect(parsed.mod).toBe('Matemática/Álgebra/Grupos');
      expect(parsed.sym).toBe('mult/mon/Identidade');
      expect(parsed.theoryUri).toBe('jarvis://vault?Matemática/Álgebra/Grupos');
      expect(parsed.canonical).toBe(
        'jarvis://vault?Matemática/Álgebra/Grupos?mult/mon/Identidade'
      );
    });

    it('garante zero colisões entre conceitos homônimos em domínios diferentes', () => {
      const normalAlgebra = MMTUriResolver.parseCanonical(
        'jarvis://vault?Teoria de Grupos?Def - Normal'
      );
      const normalGeometria = MMTUriResolver.parseCanonical(
        'jarvis://vault?Geometria Diferencial?Def - Normal'
      );

      expect(normalAlgebra.sym).toBe(normalGeometria.sym);
      expect(normalAlgebra.theoryUri).not.toBe(normalGeometria.theoryUri);
      expect(normalAlgebra.canonical).not.toBe(normalGeometria.canonical);
    });

    it('rejeita URIs malformados (múltiplos ?, fragmentos #, segmentos vazios)', () => {
      // Sem delimitador ?
      expect(() => MMTUriResolver.parseCanonical('jarvis://vault/Def - Grafo')).toThrow(
        /Ausência do delimitador/
      );

      // Apenas um ?
      expect(() => MMTUriResolver.parseCanonical('jarvis://vault?Teoria dos Grafos')).toThrow(
        /incompleta/
      );

      // Três ?
      expect(() =>
        MMTUriResolver.parseCanonical('jarvis://vault?Mod?Sym?Extra')
      ).toThrow(/excedentes/);

      // Fragmento # proibido
      expect(() =>
        MMTUriResolver.parseCanonical('jarvis://vault?Mod?Sym#secao')
      ).toThrow(/Fragmento '#' é proibido/);

      // Segmento mod ou sym vazio
      expect(() => MMTUriResolver.parseCanonical('jarvis://vault??Sym')).toThrow(
        /incompleta/
      );
      expect(() => MMTUriResolver.parseCanonical('jarvis://vault?   ?Sym')).toThrow(
        /Segmento 'mod' vazio/
      );
      expect(() => MMTUriResolver.parseCanonical('jarvis://vault?Mod?   ')).toThrow(
        /incompleta|Segmento 'sym' vazio/
      );

      // Barra duplicada / sub-segmento vazio
      expect(() =>
        MMTUriResolver.parseCanonical('jarvis://vault?Matemática//Grafos?Def - Grafo')
      ).toThrow(/Sub-segmento vazio/);
    });
  });

  describe('buildNoteUri & buildSchemeUri (Endereçamento de I-Nodes e S-Nodes)', () => {
    it('constrói URI de I-Node limpando colchetes de wikilink e usando fallback __unassigned__', () => {
      const withDomain = MMTUriResolver.buildNoteUri(
        '[[Def - Grafo|Grafo]]',
        '[[Teoria dos Grafos]]'
      );
      expect(withDomain.canonical).toBe(
        `${DEFAULT_DOC_URI}?Teoria dos Grafos?Def - Grafo`
      );

      const unassigned = MMTUriResolver.buildNoteUri('Nota Solta');
      expect(unassigned.mod).toBe(UNASSIGNED_DOMAIN);
      expect(unassigned.canonical).toBe(
        `${DEFAULT_DOC_URI}?${UNASSIGNED_DOMAIN}?Nota Solta`
      );
    });

    it('gera URIs determinísticos e únicos para S-Nodes ($ra_k, $ca_k, $pa_k)', () => {
      const hostUri = MMTUriResolver.buildNoteUri('Def - Grafo', 'Teoria dos Grafos');

      const ra0 = MMTUriResolver.buildSchemeUri(hostUri, 'ra', 0);
      const ra1 = MMTUriResolver.buildSchemeUri(hostUri, 'ra', 1);
      const ca0 = MMTUriResolver.buildSchemeUri(hostUri, 'ca', 0);

      expect(ra0.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Grafo/$ra_0'
      );
      expect(ra1.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Grafo/$ra_1'
      );
      expect(ca0.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Grafo/$ca_0'
      );

      expect(MMTUriResolver.isSchemeUri(ra0)).toBe(true);
      expect(MMTUriResolver.isSchemeUri(ca0)).toBe(true);
      expect(MMTUriResolver.isSchemeUri(hostUri)).toBe(false);

      expect(() => MMTUriResolver.buildSchemeUri(hostUri, 'ra', -1)).toThrow();
    });
  });

  describe('resolveRelative & resolveWikilink (Escopos MMT e Wikilinks Contextuais)', () => {
    const baseUri = MMTUriResolver.parseCanonical(
      'jarvis://vault?Teoria dos Grafos?Def - Grafo Conexo'
    );

    it('resolve as 4 sintaxes explícitas MMT (??sym, ?/mod?sym, ?mod?sym, doc?mod?sym)', () => {
      // 1. Intra-domínio ??sym0
      const intra = MMTUriResolver.resolveRelative(baseUri, '??Def - Caminho');
      expect(intra.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Caminho'
      );

      // 2. Subdomínio ?/mod0?sym0
      const sub = MMTUriResolver.resolveRelative(
        baseUri,
        '?/Grafos Dirigidos?Def - Componente Fortemente Conexo'
      );
      expect(sub.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos/Grafos Dirigidos?Def - Componente Fortemente Conexo'
      );

      // 3. Inter-domínio no mesmo pacote ?mod0?sym0
      const inter = MMTUriResolver.resolveRelative(
        baseUri,
        '?Teoria dos Conjuntos?Def - Relação de Equivalência'
      );
      expect(inter.canonical).toBe(
        'jarvis://vault?Teoria dos Conjuntos?Def - Relação de Equivalência'
      );

      // 4. Inter-pacote absoluto doc0?mod0?sym0
      const externalPkg = MMTUriResolver.resolveRelative(
        baseUri,
        'pkm://shared-vault?Lógica Clássica?Axiom - Identidade'
      );
      expect(externalPkg.canonical).toBe(
        'pkm://shared-vault?Lógica Clássica?Axiom - Identidade'
      );
    });

    it('resolve Wikilinks normais do Obsidian cruzando o mapa do cofre (Intra, Cross-Domain, Multihoming e Placeholder)', () => {
      const vaultLookup = new Map<string, VaultNoteSymbolInfo>([
        [
          'Def - Vértice',
          {
            symbolName: 'Def - Vértice',
            domainFields: ['Teoria dos Grafos']
          }
        ],
        [
          'Def - Conjunto',
          {
            symbolName: 'Def - Conjunto',
            domainFields: ['Teoria dos Conjuntos']
          }
        ],
        [
          'Def - Entropia',
          {
            symbolName: 'Def - Entropia',
            domainFields: ['Termodinâmica', 'Teoria dos Grafos']
          }
        ],
        [
          'Nota Sem Campo',
          {
            symbolName: 'Nota Sem Campo',
            domainFields: []
          }
        ]
      ]);

      // A) Mesmo domínio -> isCrossDomain: false, isPlaceholder: false
      const verticeRes = MMTUriResolver.resolveWikilink(
        baseUri,
        '[[Def - Vértice|Vértice]]',
        vaultLookup
      );
      expect(verticeRes.uri.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Vértice'
      );
      expect(verticeRes.isCrossDomain).toBe(false);
      expect(verticeRes.isPlaceholder).toBe(false);

      // B) Outro domínio (Boundary Anchor) -> resolve para Teoria dos Conjuntos, isCrossDomain: true
      const conjuntoRes = MMTUriResolver.resolveWikilink(
        baseUri,
        '[[Def - Conjunto]]',
        vaultLookup
      );
      expect(conjuntoRes.uri.canonical).toBe(
        'jarvis://vault?Teoria dos Conjuntos?Def - Conjunto'
      );
      expect(conjuntoRes.isCrossDomain).toBe(true);
      expect(conjuntoRes.isPlaceholder).toBe(false);

      // C) Nota Multihomed que inclui o domínio atual -> prioriza intra-domínio sem falsa âncora
      const entropiaRes = MMTUriResolver.resolveWikilink(
        baseUri,
        '[[Def - Entropia]]',
        vaultLookup
      );
      expect(entropiaRes.uri.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Entropia'
      );
      expect(entropiaRes.isCrossDomain).toBe(false);
      expect(entropiaRes.isPlaceholder).toBe(false);

      // D) Nota existente sem Domain Fields -> cai em __unassigned__
      const semCampoRes = MMTUriResolver.resolveWikilink(
        baseUri,
        '[[Nota Sem Campo]]',
        vaultLookup
      );
      expect(semCampoRes.uri.canonical).toBe(
        `jarvis://vault?${UNASSIGNED_DOMAIN}?Nota Sem Campo`
      );
      expect(semCampoRes.isCrossDomain).toBe(true);
      expect(semCampoRes.isPlaceholder).toBe(false);

      // E) Ghost Link (Nota fantasma ainda não criada) -> herda domínio pai com isPlaceholder: true
      const ghostRes = MMTUriResolver.resolveWikilink(
        baseUri,
        '[[Def - Conceito Futuro]]',
        vaultLookup
      );
      expect(ghostRes.uri.canonical).toBe(
        'jarvis://vault?Teoria dos Grafos?Def - Conceito Futuro'
      );
      expect(ghostRes.isCrossDomain).toBe(false);
      expect(ghostRes.isPlaceholder).toBe(true);
    });
  });
});
