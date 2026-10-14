// packages/core/src/graph-index.ts

import type { VaultFSSandbox } from './vault-fs.js';

export type SemanticLinkType = 
  | 'broader_field' | 'coordinate_field' | 'narrower_field' | 'core_object' | 'machinery'
  | 'domain_field' | 'presupposed_concept' | 'coordinate_concept' | 'derived_concept'
  | 'source' | 'main_note' | 'generic';

export interface LinkNode {
  targetPath: string;
  semanticType: SemanticLinkType;
}

export interface Taxonomy {
  broaderFields: string[];
  coordinateFields: string[];
  narrowerFields: string[];
  coreObject: string[];
  machinery: string[];
  domainFields: string[];
  presupposedConcepts: string[];
  coordinateConcepts: string[];
  derivedConcepts: string[];
  sources?: string[];
  mainNotes?: string[];
}

export interface NoteNode {
  path: string;
  tags: string[];
  outlinks: string[]; // Todos os links de saída da nota
  detailedOutlinks: LinkNode[]; // Links classificados pela taxonomia
  taxonomy: Taxonomy;
}

export class GraphIndex {
  private nodes = new Map<string, NoteNode>();
  private backlinkMap = new Map<string, Set<string>>();

  /**
   * Constrói o índice completo varrendo todas as notas permitidas no cofre.
   */
  public async buildIndex(vault: VaultFSSandbox): Promise<void> {
    this.clear();
    const files = await vault.listMarkdownFiles();
    for (const file of files) {
      const readResult = await vault.readNote(file);
      this.addNote(readResult.relativePath, readResult.content);
    }
  }

  /**
   * Limpa todo o índice em memória.
   */
  public clear(): void {
    this.nodes.clear();
    this.backlinkMap.clear();
  }

  /**
   * Adiciona ou atualiza uma nota no índice em memória.
   */
  public addNote(path: string, content: string): void {
    const normalizedPath = path.split('\\').join('/').replace(/^\.\//, '');
    const tags = this.extractTags(content);
    const { outlinks, detailedOutlinks, taxonomy } = this.parseContentLinks(content);

    // Remove referências antigas caso a nota já tenha sido indexada antes
    this.removeBacklinksForSource(normalizedPath);

    const node: NoteNode = {
      path: normalizedPath,
      tags,
      outlinks,
      detailedOutlinks,
      taxonomy
    };

    this.nodes.set(normalizedPath, node);

    // Registra backlinks para cada link de saída
    for (const link of outlinks) {
      for (const key of this.getLookupKeys(link)) {
        let set = this.backlinkMap.get(key);
        if (!set) {
          set = new Set<string>();
          this.backlinkMap.set(key, set);
        }
        set.add(normalizedPath);
      }
    }
  }

  public getNote(path: string): NoteNode | undefined {
    const normalizedPath = path.split('\\').join('/').replace(/^\.\//, '');
    return this.nodes.get(normalizedPath);
  }

  /**
   * Remove uma nota do índice e desconecta todos os backlinks associados a ela.
   * Retorna true se a nota existia e foi removida, false caso contrário.
   */
  public removeNote(path: string): boolean {
    const normalizedPath = path.split('\\').join('/').replace(/^\.\//, '');
    if (!this.nodes.has(normalizedPath)) {
      return false;
    }

    this.removeBacklinksForSource(normalizedPath);
    this.nodes.delete(normalizedPath);
    return true;
  }

  public getAllNodes(): NoteNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Retorna os links de saída de uma nota com seus respectivos tipos semânticos.
   */
  public getOutlinks(relativePath: string): LinkNode[] {
    const node = this.getNote(relativePath);
    return node ? node.detailedOutlinks : [];
  }

  /**
   * Retorna todas as notas que apontam para a nota informada (Backlinks).
   */
  public getBacklinks(relativePath: string): string[] {
    const keys = this.getLookupKeys(relativePath);
    const results = new Set<string>();

    for (const key of keys) {
      const sources = this.backlinkMap.get(key);
      if (sources) {
        for (const src of sources) {
          results.add(src);
        }
      }
    }

    return Array.from(results);
  }

  private removeBacklinksForSource(sourcePath: string): void {
    for (const [target, sources] of this.backlinkMap.entries()) {
      sources.delete(sourcePath);
      if (sources.size === 0) {
        this.backlinkMap.delete(target);
      }
    }
  }

  private getLookupKeys(rawPath: string): string[] {
    const normalized = rawPath.split('\\').join('/').trim().replace(/^\.\//, '');
    const withoutMd = normalized.replace(/\.md$/i, '');
    const baseName = withoutMd.split('/').pop() || withoutMd;

    const keys = new Set<string>([normalized, withoutMd, baseName]);
    return Array.from(keys).filter(Boolean);
  }

  private extractTags(content: string): string[] {
    // Captura tags ignorando formatações no meio de palavras. Ex: #tag
    const matches = [...content.matchAll(/(?<=^|\s)#([A-Za-z0-9_/-]+)/g)];
    return matches.map(m => m[1]);
  }

  private extractLinksFromLine(text: string): string[] {
    // Captura TUDO que estiver dentro de [[ ]] de forma não-gulosa (.*?)
    const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];
    
    return matches.map(m => {
      let insideText = m[1];
      // Se houver um pipe (Alias), pega apenas a primeira metade
      insideText = insideText.split('|')[0];
      // Se houver uma âncora (#seção), descarta
      insideText = insideText.split('#')[0];
      return insideText.trim();
    }).filter(link => link.length > 0);
  }

  private parseContentLinks(content: string): {
    outlinks: string[];
    detailedOutlinks: LinkNode[];
    taxonomy: Taxonomy;
  } {
    const lines = content.split(/\r?\n/);
    
    const taxonomy: Taxonomy = {
      broaderFields: [], coordinateFields: [], narrowerFields: [],
      coreObject: [], machinery: [], domainFields: [],
      presupposedConcepts: [], coordinateConcepts: [], derivedConcepts: [],
      sources: [], mainNotes: []
    };

    const outlinks: string[] = [];
    const detailedOutlinks: LinkNode[] = [];

    const addLinks = (links: string[], type: SemanticLinkType) => {
      for (const link of links) {
        outlinks.push(link);
        detailedOutlinks.push({ targetPath: link, semanticType: type });
      }
    };

    for (const line of lines) {
      const lineLinks = this.extractLinksFromLine(line);
      if (lineLinks.length === 0) continue;

      if (line.includes('**Broader Fields**:') || line.includes('**Broader Field**:')) {
        taxonomy.broaderFields.push(...lineLinks);
        addLinks(lineLinks, 'broader_field');
      } else if (line.includes('**Coordinate Fields**:') || line.includes('**Coordinate Field**:')) {
        taxonomy.coordinateFields.push(...lineLinks);
        addLinks(lineLinks, 'coordinate_field');
      } else if (line.includes('**Narrower Fields**:') || line.includes('**Narrower Field**:')) {
        taxonomy.narrowerFields.push(...lineLinks);
        addLinks(lineLinks, 'narrower_field');
      } else if (line.includes('**Core Object**:') || line.includes('**Core Objects**:')) {
        taxonomy.coreObject.push(...lineLinks);
        addLinks(lineLinks, 'core_object');
      } else if (line.includes('**Machinery**:')) {
        taxonomy.machinery.push(...lineLinks);
        addLinks(lineLinks, 'machinery');
      } else if (line.includes('**Domain Fields**:') || line.includes('**Domain Field**:')) {
        taxonomy.domainFields.push(...lineLinks);
        addLinks(lineLinks, 'domain_field');
      } else if (line.includes('**Presupposed Concept**:') || line.includes('**Presupposed Concepts**:')) {
        taxonomy.presupposedConcepts.push(...lineLinks);
        addLinks(lineLinks, 'presupposed_concept');
      } else if (line.includes('**Coordinate Concepts**:') || line.includes('**Coordinate Concept**:')) {
        taxonomy.coordinateConcepts.push(...lineLinks);
        addLinks(lineLinks, 'coordinate_concept');
      } else if (line.includes('**Derived Concepts**:') || line.includes('**Derived Concept**:')) {
        taxonomy.derivedConcepts.push(...lineLinks);
        addLinks(lineLinks, 'derived_concept');
      } else if (line.includes('**Source**:') || line.includes('**Sources**:')) {
        taxonomy.sources!.push(...lineLinks);
        addLinks(lineLinks, 'source');
      } else if (line.includes('**Main Note**:') || line.includes('**Main Notes**:')) {
        taxonomy.mainNotes!.push(...lineLinks);
        addLinks(lineLinks, 'main_note');
      } else {
        // Link genérico encontrado no corpo do texto fora da taxonomia padrão
        addLinks(lineLinks, 'generic');
      }
    }

    return { outlinks, detailedOutlinks, taxonomy };
  }
}