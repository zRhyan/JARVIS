// packages/core/src/graph-index.ts

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
}

export interface NoteNode {
  path: string;
  tags: string[];
  outlinks: string[]; // Todos os links de saída da nota
  taxonomy: Taxonomy;
}

export class GraphIndex {
  private nodes = new Map<string, NoteNode>();

  /**
   * Adiciona ou atualiza uma nota no índice em memória.
   */
  public addNote(path: string, content: string): void {
    const tags = this.extractTags(content);
    const outlinks = this.extractLinks(content);
    const taxonomy = this.extractTaxonomy(content);

    this.nodes.set(path, { path, tags, outlinks, taxonomy });
  }

  public getNote(path: string): NoteNode | undefined {
    return this.nodes.get(path);
  }

  public getAllNodes(): NoteNode[] {
    return Array.from(this.nodes.values());
  }

  private extractTags(content: string): string[] {
    // Captura tags ignorando formatações no meio de palavras. Ex: #tag
    const matches = [...content.matchAll(/(?<=^|\s)#([A-Za-z0-9_/-]+)/g)];
    return matches.map(m => m[1]);
  }

  private extractLinks(text: string): string[] {
    // Captura TUDO que estiver dentro de [[ ]] de forma não-gulosa (.*?)
    const matches = [...text.matchAll(/\[\[(.*?)\]\]/g)];
    
    return matches.map(m => {
      const insideText = m[1];
      // Se houver um pipe (Alias), o split('|')[0] pega apenas a primeira metade. 
      // Se não houver, pega o texto inteiro. O trim() garante que não fiquem espaços.
      return insideText.split('|')[0].trim();
    });
  }

  private extractTaxonomy(content: string): Taxonomy {
    // Usa \r?\n para garantir leitura perfeita no Windows e no Linux
    const lines = content.split(/\r?\n/);
    
    const taxonomy: Taxonomy = {
      broaderFields: [], coordinateFields: [], narrowerFields: [],
      coreObject: [], machinery: [], domainFields: [],
      presupposedConcepts: [], coordinateConcepts: [], derivedConcepts: []
    };

    for (const line of lines) {
      if (line.includes('**Broader Fields**:')) taxonomy.broaderFields.push(...this.extractLinks(line));
      if (line.includes('**Coordinate Fields**:')) taxonomy.coordinateFields.push(...this.extractLinks(line));
      if (line.includes('**Narrower Fields**:')) taxonomy.narrowerFields.push(...this.extractLinks(line));
      if (line.includes('**Core Object**:')) taxonomy.coreObject.push(...this.extractLinks(line));
      if (line.includes('**Machinery**:')) taxonomy.machinery.push(...this.extractLinks(line));
      if (line.includes('**Domain Fields**:')) taxonomy.domainFields.push(...this.extractLinks(line));
      if (line.includes('**Presupposed Concept**:')) taxonomy.presupposedConcepts.push(...this.extractLinks(line));
      if (line.includes('**Coordinate Concepts**:')) taxonomy.coordinateConcepts.push(...this.extractLinks(line));
      if (line.includes('**Derived Concepts**:')) taxonomy.derivedConcepts.push(...this.extractLinks(line));
    }

    return taxonomy;
  }
}