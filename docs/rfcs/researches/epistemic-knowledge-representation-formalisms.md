# Epistemic Knowledge Representation Formalisms: A Deep Research Specification for Hybrid Deductive-Defeasible Architectures

## 1. Context and the Fundamental Problem in Knowledge Representation

The design of a computational architecture for a local Artificial Intelligence knowledge agent, specifically one integrated with an atomic, Markdown-based Personal Knowledge Management (PKM) system, requires bridging a profound epistemological and structural gap. Contemporary Knowledge Graphs rely heavily on the Resource Description Framework (RDF), structured as binary triples (subject, predicate, object), and are frequently modeled as naive Directed Acyclic Graphs (DAGs). These standard architectures suffer from acute representational inadequacy when tasked with mapping hierarchical knowledge networks across radically heterogeneous domains. A universal agent must seamlessly navigate strictly deductive formal systems, such as mathematical logic and abstract algebra, while simultaneously processing empirical, defeasible disciplines like cognitive psychology, systematic theology, and epistemology.

The core technical failure of standard Knowledge Graphs and DAGs in this context manifests across three distinct dimensions of epistemic derivation:

First, standard graph edges possess inherently inadequate arity for logical derivation. Standard directed edges denote simple binary relations ($A \rightarrow C$). They fundamentally fail to distinguish between joint deductive premises, where multiple axioms are required to derive a conclusion ($A \wedge B \vdash C$), versus independent alternative derivations, where multiple distinct paths lead to the same conclusion ($A \vdash C$, $B \vdash C$). While reification techniques in RDF allow for the creation of intermediate node entities to represent N-ary relations, this approach induces severe graph bloat, degrades computational cache locality, and breaks the native traversal algorithms expected of high-performance graph databases.

Second, classical formalisms enforce an epistemic modality heterogeneity failure. The monotonic deductive implication ($A \Rightarrow B$) constitutes the bedrock of formal logic and automated theorem proving. However, monotonicity collapses entirely in empirical, dialectical, and humanistic fields. In these domains, reasoning is defeasible, probabilistic, and heavily subject to counter-arguments and exceptions. Standard graph architectures cannot natively represent defeasible rules, probabilistic weights, or undercutters without polluting the primary semantic network with metadata that standard query engines cannot interpret logically.

Third, system architects face an intractable over-formalization versus flatness dilemma. Strict formal proof systems—such as Proof Nets, the Calculus of Inductive Constructions, and Merkle DAGs found in theorem provers like Coq and Lean—reject informal or semi-formal human knowledge entirely due to syntactic rigidity. Conversely, standard PKM graph applications utilize undifferentiated outlinks and backlinks, flattening all semantic dependencies into associative noise. This flattening destroys causal precedence, temporal order, and deductive derivation, rendering the resulting graph analytically useless for an AI agent attempting to verify the truth-value of a user's epistemic network.

To resolve these tensions, this research specification conducts an exhaustive academic and technological investigation into advanced formal graph, hypergraph, and category-theoretic formalisms. The objective is to define a unified architectural framework that balances mathematical rigor in tracking derivations from primitive concepts with sufficient domain-agnostic flexibility to encompass empirical, defeasible, and axiomatic knowledge alike.

## 2. Formalisms and Mathematical Foundations

### 2.1 Directed Hypergraphs and B-Hypergraph Topologies

To transcend the binary limitations of standard directed graphs and address the arity of inferences, Directed Hypergraphs generalize edges to connect arbitrary sets of vertices. In Knowledge Representation and Rule-Based AI systems, directed hypergraphs provide the foundational topological model for multi-premise inference.

#### Formal Definition and Structure

A directed hypergraph is formally defined as a pair $\mathcal{H} = (V, E)$, where $V$ is a set of vertices (or hypervertices) and $E$ is a set of hyperedges. Each hyperedge $e \in E$ is an ordered pair $(T_e, H_e)$, where $T_e \subseteq V$ represents the tail (source nodes) and $H_e \subseteq V \setminus T_e$ represents the head (target nodes). A hypergraph can be further classified based on the cardinality constraints of its heads and tails.

For the purposes of epistemic knowledge representation, the most critical subclass is the Backward-Hypergraph, or B-Hypergraph. A B-Hypergraph restricts every hyperedge to having exactly one head node ($\vert{}H_e\vert{} = 1$), while permitting an arbitrary number of tail nodes. This structure maps perfectly to logical derivation and backward-chaining rule execution: a set of joint premises ($T_e$) yields a single, unified conclusion ($H_e$). In a rule-based computational system, a B-arc exactly mirrors an inference step $A_1, A_2, \dots, A_n \vdash C$. Conversely, an F-Hypergraph (Forward-Hypergraph) restricts tails to a single node ($\vert{}T_e\vert{} = 1$) with multiple head nodes, modeling processes like chemical dissociation, while a BF-Hypergraph allows single nodes on either end. The B-Hypergraph is the optimal native structure for tracking epistemic derivations.

#### Computational Complexities: Reachability, Ordering, and Cycle Detection

Moving from standard DAGs to B-Hypergraphs alters the fundamental algorithmic complexity of graph traversal, imposing specific constraints on the performance of a local AI agent.

|**Algorithmic Operation**|**Standard DAG Complexity**|**B-Hypergraph Complexity**|**Epistemic Implication**|
|---|---|---|---|
|Reachability (Forward)|$O(V+E)$ via BFS/DFS|$O(size(\mathcal{H}))$ via B-visit|Forward chaining of derivations remains highly tractable. The cost scales linearly with the sum of all tail cardinalities.|
|Topological Ordering|$O(V+E)$|$O(size(\mathcal{H}))$|Axioms and derived theorems can be strictly ordered for rule execution, provided the hypergraph is acyclic.|
|Minimum Source Set|Polynomial (SCC condensation)|Strongly NP-hard|Finding the absolute minimum set of base axioms required to prove a complex theorem scales exponentially.|
|Shortest Acyclic Hyperpath|Polynomial (Dijkstra/Bellman-Ford)|NP-hard|Identifying the most efficient derivation path in a network containing cyclic interdependencies requires Integer Linear Programming (ILP) or Branch-and-Bound heuristics.|

Reachability in a B-Hypergraph is defined by hyperpaths. A hyperpath from a source set $S$ to a target node $t$ is a minimal subhypergraph where $t$ can be derived using only edges whose tails are fully satisfied by $S$ or previously derived nodes. Reachability algorithms, formally termed "B-visits," operate by maintaining a priority queue of satisfied vertices. A B-visit traverses the hypergraph in $O(size(\mathcal{H}))$ time, where $size(\mathcal{H})$ is the sum of the cardinalities of all tails in the hypergraph, defined as $size(\mathcal{H}) = \sum_{e \in E} \vert{}T_e\vert{}$. Thus, forward reachability remains computationally tractable and can run deterministically in a local agent environment.

However, resolving inverse queries introduces severe computational bottlenecks. The Minimum Source Set (MinSS) problem—identifying the smallest combination of foundational notes required to support a specific target conclusion—is NP-hard in B-Hypergraphs. Furthermore, computing the shortest acyclic B-hyperpath in a graph containing cyclic definitions often requires sophisticated Integer Linear Programming (ILP) to optimize cost functions, as acyclicity cannot be trivially enforced without breaking valid derivational branches.

### 2.2 Structured Computational Argumentation Frameworks

While B-Hypergraphs solve the arity problem by mathematically grouping joint premises, they do not inherently resolve the epistemic modality problem. The B-Hypergraph is a structural topology; it requires a logical semantic layer to process defeasibility, probability, and dialectical conflict. For this, structured computational argumentation frameworks—specifically ASPIC+ and the Argument Interchange Format (AIF)—must be integrated.

#### Defeasibility and ASPIC+ Semantics

The ASPIC+ framework provides a rigorous, extensible calculus for structured argumentation, effectively bridging the gap between classical monotonic logic and Dung's abstract argumentation frameworks. ASPIC+ defines an argumentation theory as a tuple $AT = (AS, K)$, where $AS$ represents the argumentation system and $K$ represents the knowledge base.

The Knowledge Base enforces an epistemic distinction between infallible data and tentative data. It differentiates between axioms ($K_n$), which are indisputable truths, and ordinary premises ($K_p$), which are defeasible assumptions subject to challenge.

The Argumentation System $AS$ consists of two distinct sets of inference rules:

1. **Strict Rules ($R_s$):** Denoted as $\phi_1, \dots, \phi_n \rightarrow \psi$. These rules guarantee monotonic derivation. If the premises are accepted as true, the conclusion is undeniably true, mimicking classical deduction.
    
2. **Defeasible Rules ($R_d$):** Denoted as $\phi_1, \dots, \phi_n \Rightarrow \psi$. These rules allow conclusions to be drawn tentatively, reflecting empirical generalizations, default reasoning, and statistical correlations.
    

Arguments are constructed recursively by applying these rules to the knowledge base. Once generated, ASPIC+ evaluates the ultimate acceptance of these arguments by determining how they attack one another. The framework formalizes three specific types of dialectical defeat:

|**Attack Modality**|**Target in the Argumentation Graph**|**Epistemic Function in a PKM Agent**|
|---|---|---|
|**Undermining**|Attacks an ordinary premise ($p \in K_p$).|Challenges the foundational assumptions or empirical data points of an argument.|
|**Rebutting**|Attacks the conclusion of a defeasible rule ($\Rightarrow \psi$).|Provides counter-evidence directly contradicting the tentative claim made by the opponent.|
|**Undercutting**|Attacks the application of the defeasible rule itself.|Argues that the rule is invalid in this specific context without attacking the premises or the final conclusion directly.|

ASPIC+ resolves these attacks using preference orderings—such as the weakest-link or last-link principles—to determine which argument survives the conflict. The surviving arguments form extensions (e.g., grounded, preferred, or stable extensions) that define the objectively justified knowledge within the system.

#### Bipartite Operationalization via the Argument Interchange Format (AIF)

To operationalize ASPIC+ semantics within a computational graph database, the mathematics must be serialized into a queryable data structure. The Argument Interchange Format (AIF) achieves this by translating ASPIC+ rules into a strict bipartite directed graph.

The AIF ontology divides all network nodes into two disjoint sets: Information Nodes and Scheme Nodes:

- **Information Nodes (I-nodes):** Represent declarative propositions, sentences, claims, or, in the context of a PKM, atomic Markdown notes.
    
- **Scheme Nodes (S-nodes):** Represent the active application of rules or attacks. S-nodes are subdivided into:
    
    - **RA-nodes (Rule Application):** Represent inferences and derivations ($A, B \rightarrow C$).
        
    - **CA-nodes (Conflict Application):** Represent the attacks (undercutting, rebutting, undermining) between arguments.
        
    - **PA-nodes (Preference Application):** Represent explicit preference orderings between conflicting rules.
        

The foundational bipartite constraint of AIF mandates that an edge can only connect an I-node to an S-node, or an S-node to an I-node. The only exception occurs when an S-node targets another S-node, which is strictly limited to undercutting attacks (a CA-node targeting an RA-node).

This bipartite structure acts as an operational, lightweight schema perfectly suited for personal knowledge bases. An atomic Markdown note represents an I-node. When a user creates a wikilink bridging two notes to form a derivation, the agent injects an RA-node between them. If the user authors a counter-argument, the system generates a CA-node targeting the specific I-node (rebutting) or the intermediate RA-node (undercutting). This effectively isolates the logical superstructure from the underlying text, allowing deterministic truth-maintenance algorithms to traverse the graph and evaluate semantic validity without resorting to complex natural language processing during execution.

### 2.3 Theory Graphs and Modular Namespaces

The transition from granular propositional logic to macroscopic domains of knowledge requires robust modularity. If all knowledge in a PKM is evaluated in a single, global context, the system will inevitably collapse under the weight of logical contradictions between disparate fields (e.g., a premise that is true in Newtonian physics but false in quantum mechanics). The Meta-Meta-Theories (MMT) architecture, developed by the KWARC research group, provides a foundation-independent framework to structure mathematical and scientific knowledge into modular "theory graphs".

#### Theory Morphisms and Boundary Anchors

In the MMT framework, domain knowledge is encapsulated within modular theories. These theories serve as nodes in a macroscopic graph and contain declarations of primitive constants, types, and foundational axioms. Theories are interconnected by theory morphisms, which operate as edges representing truth-preserving translations between different contexts.

MMT supports two primary types of morphisms:

1. **Inclusions (Inheritance):** A theory can inherit the axioms and vocabulary of another theory. For example, a theory of Group Theory can include the axioms of Monoid Theory, inheriting its algebraic structure seamlessly.
    
2. **Views (Representations):** A view translates the semantics of a source theory into a target theory, effectively proving that the target theory is a valid model of the source. For instance, a view can map the operations of Group Theory to the domain of Real Numbers.
    

By leveraging these morphisms, MMT avoids the over-formalization dilemma. A user can define an informal domain theory alongside a strict formal foundation (such as Zermelo-Fraenkel Set Theory or the Logical Framework LF) simultaneously. The meta-theory relation itself is represented as a morphism, allowing heterogeneous logical foundations to coexist safely in the same global graph.

#### Canonical URIs and Flattening Algorithms

To manage cross-domain dependencies and boundary anchors, MMT assigns a canonical, globally unique Uniform Resource Identifier (URI) to every declaration, axiom, and derived theorem. The URI structure follows a strict hierarchical pattern: `Graph?Theory?symbol` (e.g., `vault?intArith?assoc`).

When cross-domain dependencies occur, they are formally represented as partial theory morphisms. If an empirical field, such as cognitive psychology, utilizes a statistical mechanism like Bayesian updating, the psychological theory graph imports the specific definitions from the mathematical theory graph. By applying a mathematical "flattening" algorithm, the MMT system computes all induced statements—pulling inherited axioms across theory boundaries and dynamically generating their specific URIs in the local context without duplicating the underlying data. This architectural pattern guarantees that foundational axioms are rigorously isolated within their native local theories while remaining globally accessible and addressable for downstream epistemic derivations.

### 2.4 Applied Category Theory as an Intermediate Representation

David Spivak's formalisms of Ontology Logs (Ologs) and categorical databases (C-Sets) provide the essential mathematical glue to bind natural language semantics to these strict compositional structures.

#### C-Sets and Data Migration

In Applied Category Theory, a database schema is defined as a finitely presented category $\mathcal{C}$. This category consists of objects (representing types or entities) and morphisms (representing attributes or relations), subject to specific commutativity equations that enforce path equivalences. A database instance is then formalized as a functor $F: \mathcal{C} \rightarrow \mathbf{Set}$, which maps the objects in the schema to sets of IDs (the actual data rows) and the morphisms to mathematical functions between those sets. This construct is known as a C-Set.

C-Sets present a highly workable intermediate representation that vastly outperforms standard RDF triples. While RDF flattens schemas into an untyped soup of subject-predicate-object links, C-Sets retain strict algebraic boundaries and enforce structural integrity at the functorial level. A PKM architecture can define its foundational schema as a category $\mathcal{C}$ containing the objects `I-Node`, `RA-Node`, and `CA-Node`, alongside morphisms representing their valid bipartite connections.

Furthermore, Category Theory provides native operations for complex data management. Colimits (such as pushouts) can be utilized to glue overlapping knowledge structures together, while limits (such as pullbacks) enable complex queries and data migrations across different, heterogeneous ontologies. Modern software ecosystems, such as Julia's Catlab.jl and AlgebraicJulia, have demonstrated that C-Sets exhibit extremely high computational tractability for in-memory graph rewriting, double-pushout transformations, and model stratification, making them ideal low-level data structures for executing complex epistemic dependencies.

## 3. Implementation Architectures and Algorithmic Trade-offs

Realizing a local AI knowledge agent requires translating the aforementioned mathematical models into performant data structures. The primary decision matrix lies in how to persist the data onto disk and how to traverse the derivation graphs in memory.

### 3.1 Bipartite Graphs versus Native Hypergraphs in Graph Databases

When modeling N-ary derivations (joint premises leading to a conclusion), system architects must choose between utilizing native hyperedges and reducing the hypergraph into a bipartite directed graph.

|**Architectural Decision**|**Data Structure Complexity**|**Indexing and Database Support**|**Memory Traversal Efficiency**|
|---|---|---|---|
|**Native Hypergraph**|High. Edges exist as sets of nodes, e.g., $(\{A, B\}, \{C\})$.|Extremely poor. Standard relational databases (SQLite, PostgreSQL) and property graph DBs (Neo4j) strictly mandate binary edges. Simulating hyperedges requires sparse tensor arrays or complex middleware.|Achieves optimal theoretical scaling $O(size(\mathcal{H}))$, but practical cache-locality is compromised in standard software implementations.|
|**Bipartite Directed Graph (AIF Schema)**|Low. Enforces strictly binary edges passing through intermediate rule nodes: $I \rightarrow RA \rightarrow I$.|Excellent. Trivially represented in SQLite via relational junction tables or in Neo4j via labeled nodes. Standard B-Tree indexing applies directly and natively.|Functionally identical to B-visit. Breadth-first traversals merely execute a deterministic two-hop (Premise $\rightarrow$ Rule Node $\rightarrow$ Conclusion). Highly cache-friendly.|

In real-world computational implementations, the bipartite directed graph vastly outperforms native hypergraphs. Because major database engines lack native support for sets-as-edges, forcing a native hypergraph design introduces unacceptable serialization overhead and middleware complexity. By adopting the AIF bipartite model, an N-ary derivation $A, B \vdash C$ is stored simply as binary edges $(A, R_1)$, $(B, R_1)$, and $(R_1, C)$. The logical rigor of the Directed B-Hypergraph is preserved entirely, while achieving $O(1)$ edge lookups, maintaining standard relational integrity, and allowing logical rules to become addressable entities in the PKM.

### 3.2 Dynamic Topological Stratification and Cycle Resolution

A local AI knowledge agent must parse raw, user-generated Markdown into a topological hierarchy to process logical validity. This requires calculating the relative semantic depth of all nodes: $Level(N) = \max(Level(P_i)) + 1$ for all parent nodes $P_i$.

Unlike rigorously tested formal codebases, semi-formal human knowledge generated in a PKM will inevitably contain accidental circular dependencies (e.g., Note A defines Note B, which defines Note C, which circularly references Note A). Because strict topological sorting fails completely on cyclic graphs, the system must address the Minimum Feedback Arc Set (FAS) problem. The FAS is defined as the minimum set of edges that, if removed, renders the directed graph completely acyclic.

Since finding the exact Minimum FAS is an NP-complete problem, calculating it perfectly on a large PKM graph is computationally intractable. Standard formal heuristics must be deployed to ensure the agent runs deterministically:

1. **The Greedy Cycle Breaker (Eades et al.):** A highly efficient, linear-time heuristic algorithm designed to approximate the FAS. It sequences vertices by recursively stripping sources (indegree 0) and sinks (outdegree 0) from the graph. It then greedily chooses the vertex with the maximum difference between outdegree and indegree to iteratively break cycles. This guarantees a feedback arc set of size at most $\vert{}E\vert{}/2$, and frequently achieves at most $\vert{}E\vert{}/4$ in dense graph configurations, making it exceptionally fast for on-the-fly cycle resolution.
    
2. **Epistemic Flagging (Non-Destructive Resolution):** A critical requirement for a PKM is that user data is never destroyed by algorithmic intervention. Once the FAS heuristic identifies the cyclic edges, the database must not delete them. Instead, it alters their edge property in the AIF bipartite schema. The system dynamically downgrades the offending edge from an RA-node (a strict logical inference) to an MA-node (a pure Mapping Application or associative link). This removes the edge from the strict logical DAG used for topological stratification, while preserving the user's intended navigational wikilink in the PKM GUI.
    

This dynamic cycle resolution allows the in-memory traversal engine to calculate semantic depth safely, processing the foundational axioms (Level 0) forward, while gracefully degrading cyclic, contradictory empirical thoughts into unverified associative clusters.

## 4. Comparative Synthesis and Architectural Recommendation

### 4.1 Comparative Evaluation Matrix

To synthesize the findings, the candidate formalisms are evaluated across four primary architectural criteria crucial for a hybrid deductive-defeasible local AI agent.

|**Criterion**|**Directed B-Hypergraphs**|**ASPIC+/AIF Bipartite Graphs**|**MMT/OMDoc Theory Graphs**|
|---|---|---|---|
|**Expressive Power**|High for joint deductive premises. Low for dialectical attacks, defeasibility, and modalities.|Maximum. Natively supports joint premises, defeasible inferences, and distinct dialectical attacks (rebutting, undercutting).|High for truth-preservation, inheritance, and macroscopic namespace management.|
|**Epistemic Universality**|Best suited for strictly monotonic systems like Chemistry and Mathematical Logic.|Best suited for empirical, legal, and dialectical fields relying on default reasoning.|Maximum. Foundation-independent: spans diverse logics including LF, ZFC, and informal semantics.|
|**Computational Tractability**|Forward reachability is polynomial ($O(size)$). Minimum source sets and cyclic paths are NP-hard.|High. Dung semantics can scale efficiently if the evaluation is restricted to grounded extensions.|High via URI flattening algorithms and lazy modular boundary evaluations.|
|**Implementation Overhead**|High. Lacks native database support; requires custom tensor arrays or middleware.|Low. Maps seamlessly to standard relational tables or property graph databases.|Moderate. Requires complex URI resolver engine, and flattening implementations.|

### 4.2 Architectural Specification

To achieve the optimal balance of mathematical rigor in tracking derivations, domain-agnostic flexibility for defeasible reasoning, and computational tractability for a local agent, the architecture must abandon monolithic reliance on simple DAGs or RDF triples. The system must implement a **Hybrid Bipartite C-Set Argumentation Graph**.

The specification requires the integration of four distinct layers:

1. **The Data Persistence Layer (C-Sets mapped to SQLite):** The underlying data structure is implemented as a relational SQLite database strictly utilizing the formalisms of C-Sets. The schema is defined as a finitely presented category $\mathcal{C}$. The bipartite constraint of the AIF ontology is enforced natively at the SQL level: Information Nodes and Scheme Nodes exist as isolated tables, connected by associative junction tables representing source-tail and target-head functors. This ensures ultra-fast, ACID-compliant B-Tree indexing with minimal memory overhead, easily capable of running locally as a background daemon.
    
2. **The Epistemic Logic Layer (ASPIC+ Semantics):** The embedded logic engine processes the C-Set using ASPIC+ semantics. Every user-authored Markdown wikilink is parsed and classified. A strict logical deduction compiles to a Strict Rule ($R_s$), while an empirical observation compiles to a Defeasible Rule ($R_d$). If a user authors a note refuting a previous claim, the compiler injects a CA-node (Conflict Application) acting as an undercutter or rebutting attack. This translates static markdown text into an active, computable argumentation framework.
    
3. **The Modularity and Namespace Layer (MMT Theory Graphs):** To prevent catastrophic logical collapse into "flatness," the local directory structure of the PKM (e.g., folders and tags) is treated as an MMT Theory Graph. A specific folder of atomic notes constitutes an independent "Theory". Axioms declared in a mathematical folder are logically isolated from empirical observations in a psychology folder. Cross-linking between these folders utilizes MMT-style theory morphisms, uniquely referencing remote concepts via canonical URIs (e.g., `vault?math?bayes_theorem`). The agent leverages MMT flattening algorithms to lazily induce theorems across boundaries only when explicitly imported by a user-defined view.
    
4. **The In-Memory Execution Engine (Topological Daemon):** When the user executes a query, the system loads the SQLite C-Set into a local RAM adjacency list. It immediately runs the Eades Greedy Cycle Breaker heuristic to identify Feedback Arc Sets within the defeasible subgraphs. Cyclic edges are flagged and downgraded to non-logical associative links, instantly producing a strict Directed Acyclic B-Hypergraph. The agent then performs polynomial-time B-visits starting from the user's defined axioms, dynamically propagating truth values through the ASPIC+ rules to evaluate the grounded extension of the argument network.
    

Standard Knowledge Graphs fail because they structurally equate a hyperlink with a logical implication. By mapping user-authored Markdown into an AIF-bipartite schema, enforcing defeasible reasoning through ASPIC+ logic, modularizing contexts via MMT theory morphisms, and grounding the implementation in performant categorical C-sets, the resulting system achieves profound representational adequacy. It is computationally tractable for a local machine, mathematically robust enough for automated theorem verification, yet inherently flexible enough to model the tentative, defeasible, and contradictory nature of human knowledge.

### Sources used in the report

- **arxiv.org** — Finding (s,d)-Hypernetworks in F-Hypergraphs is NP-Hard - arXiv
    
- **static.aminer.org** — DIRECTED HYPERGRAPHS AND APPLICATIONS - AMiner
    
- **biorxiv.org** — Computing Signal Transduction in Signaling Networks modeled as...
    
- **jise.iis.sinica.edu.tw** — Finding a Minimum Source Set in Directed Hypergraphs
    
- **d-nb.info** — Describing Orbitopes by Linear Inequalities and Projection Based...
    
- **researchgate.net** — (PDF) Hypergraph Models And Algorithms For The Assembly Problem
    
- **pmc.ncbi.nlm.nih.gov** — Pathway Analysis with Signaling Hypergraphs - PMC - NIH
    
- **royalsocietypublishing.org** — Assembly in Directed Hypergraphs - Royal Society Publishing
    
- **researchgate.net** — (PDF) Hypergraph traversal revisited: Cost measures and dynamic...
    
- **scribd.com** — Directed Hypergraphs: Algorithms & Applications PDF - Scribd
    
- **semanticscholar.org** — The ASPIC+ framework for structured argumentation: a tutorial
    
- **researchgate.net** — The ASPIC+ framework for structured argumentation: a tutorial
    
- **dspace.library.uu.nl** — The ASPIC+ framework for structured argumentation
    
- **www2.mta.ac.il** — Chapter 12
    
- **proceedings.kr.org** — Complexity Results and Algorithms for Preferential Argumentative...
    
- **ijcai.org** — A Fully Rational Account of Structured Argumentation Under... - IJCAI
    
- **icr.uni.lu** — ASPIC-END: Structured Argumentation with Explanations and... - ICR
    
- **webspace.science.uu.nl** — Modelling Support Relations between Arguments in Debates
    
- **ssa2024.krportal.org** — Real (Computational) Argumentation in Practice - SSA 2024
    
- **webspace.science.uu.nl** — On Logical Specifications of the Argument Interchange Format
    
- **air.unimi.it** — A logic of defeasible argumentation - AIR Unimi
    
- **orbilu.uni.lu** — dissertation - ORBilu
    
- **researchgate.net** — (PDF) TOAST: online ASPIC+ implementation - ResearchGate
    
- **arg-tech.org** — The Argument Interchange Format (AIF) Specification - ARG-tech
    
- **arxiv.org** — GF+MMT/GLF: From Language to Semantics through LF - arXiv
    
- **uniformal.github.io** — Mmt: A Foundation-Independent Approach to Formal Knowledge...
    
- **kwarc.info** — Math Literate Knowledge Management via Induced Material - KWARC
    
- **cicm-conference.org** — Searching Induced Formulae: Get out more than you put in!
    
- **arxiv.org** — A Foundational View on Integration Problems - arXiv
    
- **researchgate.net** — Theory Graph of the foundation section - ResearchGate
    
- **kwarc.info** — Virtual Theories - A Uniform Interface to Mathematical Knowledge
    
- **arxiv.org** — THE ALGEBRA AND MACHINE REPRESENTATION OF... - arXiv
    
- **epatters.org** — Publications - Evan Patterson
    
- **jpfairbanks.com** — ACT Modeling with AlgebraicJulia and Catlab - JPF
    
- **arxiv.org** — Spectral Centrality of Directed Hypergraphs - arXiv
    
- **arxiv.org** — Exact Localisations of Feedback Sets - arXiv
    
- **researchgate.net** — Research on Minimum Feedback Arc Set Problem - ResearchGate
    
- **mathworld.wolfram.com** — Feedback Arc Set Problem -- from Wolfram MathWorld
    
- **en.wikipedia.org** — Feedback arc set - Wikipedia
    
- **rtsys.informatik.uni-kiel.de** — Model Order and Cycle Breaking in SCCharts
    
- **ajc.maths.uq.edu.au** — A Heuristic for the Feedback Arc Set Problem - Peter Eades
    
- **davidbader.net** — Rocket-Crane Algorithm for the Feedback Arc Set Problem