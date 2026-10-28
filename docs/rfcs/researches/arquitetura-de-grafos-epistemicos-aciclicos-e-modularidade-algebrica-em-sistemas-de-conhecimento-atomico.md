--- 
title: Grafos Epistêmicos Modulares - Google Gemini
date: 10/28/2026, 8:17:52 AM
source: https://gemini.google.com/app/167aff38e147853e
model: Gemini
---

## Grafos Acíclicos e Conhecimento Modular

# Arquitetura de Grafos Epistémicos Acíclicos e Modularidade Algébrica em Sistemas de Conhecimento Atómico

A engenharia de sistemas de Gestão de Conhecimento Pessoal (PKM) baseados em notas atómicas em Markdown enfrenta um dilema estrutural clássico da representação do conhecimento: a tensão entre a expressividade livre da escrita humana e o rigor algébrico exigido por motores de inferência e modelos de linguagem de grande escala (LLMs). Quando utilizadores humanos articulam conceitos interligados, a emergência acidental de dependências circulares — nas quais um conceito  $A$  fundamenta  $B$ ,  $B$  fundamenta  $C$  e  $C$  retroalimenta a definição de  $A$  — destrói a propriedade de ordem parcial estrita do grafo. Sem uma topologia garantidamente acíclica (Directed Acyclic Graph — DAG), o cálculo de níveis topológicos entra em divergência e a montagem de janelas de contexto para LLMs sofre de recursão infinita ou inversão causal entre premissas e conclusões. Simultaneamente, à medida que o cofre cresce e o conhecimento é particionado em Domínios ou Campos (Theory Graphs inspirados no sistema MMT/OMDoc), torna-se imperativo isolar os axiomas primitivos de cada domínio, extrair cirurgicamente as dependências que cruzam fronteiras teóricas e estabelecer um esquema de endereçamento canónico imune a colisões de nomes.

## Fundamentos Topológicos da Rede Epistémica e o Paradigma Bipartido AIF

Para modelar dependências rigorosas entre notas atómicas sem incorrer na ambiguidade semântica de grafos simples — nos quais uma aresta direta  $u \to v$  não distingue entre uma premissa conjunta, uma derivação independente ou uma objeção —, a arquitetura adota a ontologia formal do *Argument Interchange Format* (AIF). No modelo AIF, uma Rede de Argumentação ou Rede Epistémica é definida como um dígrafo bipartido  $G = (V, E)$ , onde o conjunto de vértices  $V$  é particionado em dois subconjuntos disjuntos: nós de informação ( $V_I$ , denominados *I-nodes*) e nós de esquema ( $V_S$ , denominados *S-nodes*).

Os *I-nodes* representam unidades atómicas de conteúdo declarativo, tais como definições conceituais, proposições, teoremas ou notas individuais em Markdown, enquanto os *S-nodes* reificam a aplicação de esquemas relacionais que conectam os *I-nodes*. Estes nós de esquema subdividem-se em nós de aplicação de regras de inferência ou definição (*RA-nodes*,  $V_{RA} \subset V_S$ ), nós de aplicação de conflito (*CA-nodes*,  $V_{CA} \subset V_S$ ) e nós de preferência (*PA-nodes*,  $V_{PA} \subset V_S$ ). A especificação formal do AIF impõe uma restrição estrutural estrita segundo a qual arestas diretas entre dois nós de informação ( $V_I \times V_I$ ) são proibidas, exigindo que toda relação epistémica entre notas atómicas seja mediada por um *S-node* intermédio. Esta mediação origina duas classes fundamentais de arestas direcionadas no nível base: as arestas de fornecimento de dados (*I-to-S* ou *Data Edges*,  $e \in E_{IS} \subseteq V_I \times V_S$ ), que partem de notas premissas para alimentar a aplicação de um esquema inferencial ou definicional, e as arestas de conclusão (*S-to-I* ou *Scheme Edges*,  $e \in E_{SI} \subseteq V_S \times V_I$ ), que emanam de um *S-node* para sustentar ou definir o *I-node* de conclusão.

Embora o AIF permita arestas *S-to-S* (*warrant edges*) para representar instâncias de meta-raciocínio, a rede epistémica de dependências conceituais entre notas opera fundamentalmente sobre a projeção bipartida estrita  $G = (V_I \cup V_S, E_{IS} \cup E_{SI})$ . Esta topologia bipartida introduz invariantes combinatórios que afetam diretamente qualquer algoritmo de quebra de ciclos. Em primeiro lugar, verifica-se uma cintura direcionada (*directed girth*) obrigatoriamente par: como não existem arestas intraclasse em  $V_I$  ou  $V_S$ , qualquer ciclo direcionado  $\Gamma$  em  $G$  alterna estritamente entre *I-nodes* e *S-nodes* na forma  $\Gamma = \langle I_1, S_1, I_2, S_2, \dots, I_k, S_k, I_1 \rangle$ . Consequentemente, todo ciclo possui comprimento par  $|\Gamma| = 2k$ , e na ausência de esquemas triviais redundantes sobre a mesma nota, a cintura direcionada do grafo satisfaz  $g(G) \ge 4$ , assumindo tipicamente  $g(G) \ge 6$  para ciclos conceituais não-degenerados. Em segundo lugar, emerge uma assimetria estrutural de graus, visto que a especificação AIF estabelece que apenas *I-nodes* podem possuir grau de entrada nulo ( $d^-(v) = 0$ ), atuando como premissas ou axiomas iniciais. Todo *S-node*  $s \in V_S$  relaciona pelo menos um antecedente a pelo menos um consequente, satisfazendo  $d^-(s) \ge 1$  e  $d^+(s) = 1$  no caso canónico de uma definição conjuntiva onde múltiplas notas  $I_{p_1}, \dots, I_{p_r}$  definem conjuntamente uma nota alvo  $I_c$  através do hiper-nó  $s$ . Assim, para qualquer *S-node* multi-premissa ( $r \ge 2$ ), o saldo de grau  $\delta(s) = d^+(s) - d^-(s) = 1 - r < 0$  é estruturalmente negativo, ao passo que *I-nodes* fundamentais reutilizados em múltiplas definições apresentam  $\delta(i) = d^+(i) - d^-(i) > 0$ .

| Propriedade Topológica | Grafo de Dependências Simples (Monopartido) | Rede Epistémica Bipartida AIF (VI∪VSV_I \cup V_SVI​∪VS​) | Implicação Algorítmica para Quebra de Ciclos (FAS) |
| --- | --- | --- | --- |
| Particionamento de Vértices | Conjunto homogéneo VVV (apenas notas) | Bipartição estrita V=VI∪VSV = V_I \cup V_SV=VI​∪VS​, VI∩VS=∅V_I \cap V_S = \emptysetVI​∩VS​=∅ | O corte de uma aresta afeta diferentemente premissas (EISE_{IS}EIS​) e conclusões (ESIE_{SI}ESI​). |
| Representação de Inferência Conjuntiva | Hiper-aresta perdida (decomposta em kkk arestas independentes) | Reificada num único S-node (d−(s)=k,d+(s)=1d^-(s) = k, d^+(s) = 1d−(s)=k,d+(s)=1) | A remoção de uma aresta I→SI \to SI→S mutila a aridade da premissa conjunta; a remoção de S→IS \to IS→I despromove a inferência inteira. |
| Comprimento Mínimo de Ciclo (g(G)g(G)g(G)) | g(G)≥2g(G) \ge 2g(G)≥2 (ciclos mútuos A⇆BA \leftrightarrows BA⇆B de comprimento 2) | g(G)≥4g(G) \ge 4g(G)≥4 (ciclos alternados I1→S1→I2→S2→I1I_1 \to S_1 \to I_2 \to S_2 \to I_1I1​→S1​→I2​→S2​→I1​) | Elimina 2-ciclos diretos entre notas; aumenta o número de decomposição de FAS (fasd(G)\text{fasd}(G)fasd(G)). |
| Vértices Fonte (d−(v)=0d^-(v) = 0d−(v)=0) | Notas sem dependências | Exclusivamente I-nodes (v∈VIv \in V_Iv∈VI​) em redes AIF bem formadas | A poda gulosa de fontes inicia sempre na partição VIV_IVI​, propagando reduções de grau para VSV_SVS​. |

## Heurística de Eades (GreedyFAS) Adaptada para Grafos Bipartidos AIF

### Formulação Matemática e Adaptação ao Modelo Bipartido

O problema do *Minimum Feedback Arc Set* (FAS) consiste em encontrar um subconjunto de arestas  $F \subseteq E$  de cardinalidade ou peso total mínimo tal que o grafo residual  $G \setminus F = (V, E \setminus F)$  seja um grafo acíclico direcionado (DAG). De forma equivalente, pelo Teorema da Ordenação Linear, encontrar um FAS mínimo corresponde a determinar um arranjo linear (permutação bijetiva)  $\pi: V \to \{1, 2, \dots, |V|\}$  que minimize o conjunto de arestas de retorno (*backward/leftward arcs*)  $F_\pi = \{ (u, v) \in E \mid \pi(u) > \pi(v) \}$ . Como o problema de decisão associado é NP-completo — figurando na lista clássica dos 21 problemas de Karp —, sistemas interativos em tempo real não podem depender de programação inteira exata, cuja complexidade parametrizada atinge  $\mathcal{O}(n^4 4^k k^3 k!)$  em algoritmos FPT ou exige métodos *branch-and-cut* sobre a matriz de ciclos incomportáveis para cofres de milhares de notas.

A heurística gulosa proposta por Eades, Lin e Smyth (1993), conhecida na literatura como **GreedyFAS** ou **Algoritmo ELS**, resolve o problema construindo iterativamente uma sequência linear  $s = s_1 \mathbin{\Vert} s_2$  em tempo estritamente linear  $\mathcal{O}(|V| + |E|)$ . O algoritmo mantém duas listas de vértices, designadamente um prefixo  $s_1$  organizado como fila de inserção à direita e um sufixo  $s_2$  organizado como pilha de inserção à esquerda. Em cada iteração sobre o subgrafo ativo, o procedimento executa primeiramente a poda exaustiva de sorvedouros (*sinks*): enquanto existir um vértice  $u$  sem arestas de saída ativas ( $d^+(u) = 0$ ),  $u$  é removido do grafo e prefixado no início de  $s_2$  ( $s_2 \leftarrow u \mathbin{\Vert} s_2$ ), garantindo que nenhuma aresta incidente em  $u$  possa apontar para a esquerda quando  $u$  é posicionado à direita de todos os vértices remanescentes. Em seguida, executa-se a poda de fontes (*sources*): enquanto existir um vértice  $u$  sem arestas de entrada ativas ( $d^-(u) = 0$ ),  $u$  é removido do grafo e anexado ao final de  $s_1$  ( $s_1 \leftarrow s_1 \mathbin{\Vert} u$ ), assegurando que todas as suas arestas de saída apontem para a direita em direção a vértices ainda não posicionados ou já alocados em  $s_2$ . Quando o subgrafo residual fica desprovido tanto de fontes quanto de sorvedouros ( $d^+(u) \ge 1 \land d^-(u) \ge 1, \forall u$ ), realiza-se a escolha gulosa (*greedy selection*), selecionando o vértice  $u^*$  que maximiza o saldo líquido de graus  $\delta(u) = d^+(u) - d^-(u)$ . O vértice  $u^*$  é então removido do subgrafo e anexado ao final de  $s_1$  ( $s_1 \leftarrow s_1 \mathbin{\Vert} u^*$ ), orientando todas as suas  $d^+(u^*)$  arestas de saída para a direita como arestas válidas do DAG, ao custo controlado de converter as suas  $d^-(u^*)$  arestas de entrada em arestas de retorno (*feedback arcs*).

Contudo, aplicar o algoritmo ELS padrão de forma cega sobre um grafo bipartido AIF introduz uma anomalia semântica crítica. Num ciclo de comprimento  $2k$  composto por relações de definição simples em que  $d^+(s) = d^-(s) = 1, \forall s \in V_S$  e  $d^+(i) = d^-(i) = 1, \forall i \in V_I$ , todos os vértices do ciclo apresentam  $\delta(v) = 0$ . Se o critério de desempate da escolha gulosa selecionar um nó de esquema  $s^* \in V_S$  e o inserir em  $s_1$ , a aresta que entra em  $s^*$  — isto é, a aresta de fornecimento de dados  $(i_{\text{prem}}, s^*) \in E_{IS}$  — torna-se a aresta de retorno rebaixada. Caso  $s^*$  represente um esquema conjuntivo (*RA-node*) que combina três premissas ( $I_1, I_2, I_3 \to s^* \to I_4$ ), o corte da aresta  $(I_1, s^*)$  adultera a premissa lógica do esquema, fazendo parecer que  $I_4$  deriva apenas do subconjunto  $\{I_2, I_3\}$ .

Para preservar a integridade atómica dos esquemas AIF, a adaptação do algoritmo ELS para grafos bipartidos AIF incorpora três refinamentos algorítmicos coordenados. O primeiro refinamento consiste no isolamento prévio por Componentes Fortemente Conexos (SCCs de Tarjan): em vez de executar a heurística sobre o grafo global — o que poderia perturbar a ordenação natural de subgrafos acíclicos devido a escolhas gulosas globais —, o grafo é decomposto em tempo  $\mathcal{O}(|V| + |E|)$  nos seus Componentes Fortemente Conexos ( $C_1, C_2, \dots, C_r$ ). Componentes triviais ( $|C_i| = 1$  sem auto-laços) já são acíclicos e são ignorados, invocando-se a heurística de Eades estritamente dentro do subgrafo induzido por cada SCC não-trivial ( $\vert{}C_i\vert{} \ge 2$ ). O segundo refinamento estabelece uma ponderação assimétrica bipartida com prioridade de partição ( $V_I$  sobre  $V_S$ ): quando uma escolha gulosa ocorre num SCC, posiciona-se preferencialmente um nó de informação  $u^* \in V_I$  em  $s_1$ , ou atribui-se um peso estrutural  $w(e_{IS}) = \alpha > 1$  às arestas de ligação de premissa  $I \to S$  face a  $w(e_{SI}) = 1$  nas arestas de conclusão  $S \to I$ . Uma vez que as arestas que entram num *I-node*  $u^* \in V_I$  são exclusivamente arestas de conclusão  $(s_{\text{in}}, u^*) \in E_{SI}$ , a seleção de  $u^*$  garante que a aresta invertida ou rebaixada seja sempre uma aresta de conclusão  $S \to I$ , despromovendo o esquema inferencial  $s_{\text{in}}$  por inteiro de derivação estrita para associação epistémica enquanto mantém todas as premissas originais intactas dentro de  $s_{\text{in}}$ . O terceiro refinamento implementa uma estrutura de *buckets* duplamente ligados indexados por  $\delta(u)$ : para evitar uma busca linear  $\mathcal{O}(|V|)$  no passo guloso, que degradaria a complexidade para  $\mathcal{O}(|V|^2)$ , os vértices ativos do SCC são mantidos num vetor de listas duplamente ligadas indexado pelo saldo de grau inteiro  $\delta(u) \in [-\Delta^-, +\Delta^+]$ , deslocado por um *offset*  $\Delta^-$ . Dentro de cada *bucket*  $B[\delta]$ , os *I-nodes* são inseridos na cabeça (*head*) da lista duplamente ligada e os *S-nodes* na cauda (*tail*), garantindo em tempo constante  $\mathcal{O}(1)$  que, em caso de empate no valor máximo de  $\delta$ , um *I-node* seja sempre extraído antes de qualquer *S-node*.

### Demonstração Formal da Complexidade de Tempo e Espaço

Seja  $G = (V, E)$  a Rede Epistémica Bipartida AIF com  $n = |V| = |V_I| + |V_S|$  vértices e  $m = |E| = |E_{IS}| + |E_{SI}|$  arestas direcionadas. A demonstração de que o algoritmo adaptado opera em tempo e espaço estritamente lineares  $\Theta(n + m)$  decorre da análise das suas três fases sequenciais. Na fase inicial de decomposição em SCCs pelo algoritmo de Tarjan, realiza-se uma única travessia em profundidade (DFS) mantendo os vetores `dfn`, `lowlink` e uma pilha de visitação, na qual cada vértice é visitado exatamente uma vez e cada aresta é inspecionada exatamente uma vez, exigindo tempo  $\Theta(n + m)$ . Na fase subsequente de inicialização dos *buckets* para cada SCC não-trivial  $C_k = (V_k, E_k)$  com  $n_k = |V_k|$  e  $m_k = |E_k|$ , os graus internos  $d^+(u)$  e  $d^-(u)$  são computados em  $\mathcal{O}(n_k + m_k)$ . Como  $\forall u \in V_k, -m_k \le \delta(u) \le m_k$  — ou, mais estritamente,  $\delta(u) \in [-\Delta^-_k, +\Delta^+_k]$  onde  $\sum \Delta^+_k \le m_k$  —, a alocação e inserção inicial nos *buckets* de listas duplamente ligadas consome tempo  $\mathcal{O}(n_k + m_k)$ .

Durante a fase de manutenção dinâmica de graus e extração no laço principal sobre  $C_k$ , cada vértice  $u \in V_k$  é removido exatamente uma vez, seja como sorvedouro para  $s_2$ , como fonte para  $s_1$  ou como escolha gulosa  $u^*$  para  $s_1$ . Quando  $u$  é removido, apenas os seus vizinhos ativos  $v \in N^+(u) \cup N^-(u)$  sofrem atualização de  $d^-(v)$  ou  $d^+(v)$ , fazendo variar  $\delta(v)$  em  $\pm 1$ . A remoção de  $v$  do seu *bucket* atual  $B[\delta]$  e a sua reinserção no *bucket* adjacente  $B[\delta \pm 1]$  — ou nas filas `sinks` e `sources` quando  $d^+(v)=0$  ou  $d^-(v)=0$  — é executada em tempo constante  $\mathcal{O}(1)$  através de ponteiros intrusivos (`prev` e `next` armazenados em vetores tipados). Uma vez que o ponteiro `maxBucketIdx` pode incrementar no máximo uma unidade por cada aresta de entrada removida ao longo de toda a execução e decrementar no máximo  $2 m_k$  vezes, o custo total de localização do *bucket* máximo não-vazio é amortizado em  $\mathcal{O}(n_k + m_k)$ . Somando sobre todos os componentes fortemente conexos disjuntos ( $\sum_k n_k \le n$  e  $\sum_k m_k \le m$ ), a complexidade temporal global é estritamente  $\Theta(n + m)$ , garantindo adicionalmente um limite superior de  $|F| \le \frac{m}{2} - \frac{n}{6}$  para a cardinalidade do conjunto de arestas de retorno. Do ponto de vista espacial, as listas de adjacência direta (`outEdges`) e reversa (`inEdges`) consomem  $2m$  inteiros, enquanto os vetores de estado para Tarjan (`dfn`, `low`, `onStack`, `sccId`) e para os *buckets* de Eades (`inDeg`, `outDeg`, `bucketHead`, `bucketTail`, `prevNode`, `nextNode`, `vertexState`) utilizam vetores contíguos (`Int32Array` e `Uint8Array`) de dimensão proporcional a  $n$  ou  $2\Delta + 1 \le 2m + 1$ , resultando numa complexidade de espaço auxiliar estritamente linear  $\Theta(n + m)$ .

### Quebra de Ciclo Não-Destrutiva em Memória e Projeção Epistémica

Para garantir que os ficheiros físicos Markdown do utilizador permaneçam imutáveis em disco enquanto o motor em memória opera sobre um DAG estrito, implementa-se o padrão de **Sobreposição Epistémica em Dupla Camada (*Dual-Layer Epistemic Overlay*)**. Na literatura de desenho hierárquico de grafos baseada na arquitetura de Sugiyama e na interpretação abstrata de redes de argumentação, os ciclos são resolvidos mantendo o grafo físico subjacente intacto e anotando o subconjunto  $F$  de arestas de retorno num descritor de estado em memória. No sistema de notas atómicas, cada aresta  $e \in E$  recebe um atributo em memória `epistemicRole` que assume o valor `STRICT_DEDUCTIVE` (`0`) quando a aresta participa ativamente na relação de ordem parcial estrita  $\prec_{\text{DAG}}$ , ou o valor `ASSOCIATIVE_FEEDBACK` (`1`) quando a aresta pertence ao conjunto  $F$  identificado pela heurística de Eades adaptada. Neste segundo caso, o link Markdown original (como `[[Nota_A]]`) permanece intocado no ficheiro físico e visível na interface do utilizador, mas a sua semântica em memória é rebaixada de dependência fundacional pré-requisito para referência associativa lateral.

Esta distinção em memória resolve de forma integrada o cálculo de níveis topológicos e a injeção contextual determinística em LLMs. Para a estratificação dedutiva, o algoritmo de ordenação topológica e atribuição de camadas — baseado na remoção iterativa de fontes de Kahn ou no caminho mais longo sobre o DAG — filtra as arestas em tempo constante verificando `edge.epistemicRole === STRICT_DEDUCTIVE`. O nível epistémico ou estrato fundacional  $\mathcal{L}(v)$  de cada nota e esquema é definido recursivamente sobre o subgrafo acíclico  $G_{\text{DAG}} = (V, E \setminus F)$  através da relação:

$$ \mathcal{L}(v) = \begin{cases} 0 & \text{se } d^-_{G_{\text{DAG}}}(v) = 0 \\ 1 + \max_{(u, v) \in E \setminus F} \mathcal{L}(u) & \text{caso contrário} \end{cases} $$

Como  $G_{\text{DAG}}$  é garantidamente acíclico,  $\mathcal{L}(v)$  converge em tempo linear  $\mathcal{O}(n + m)$  e atribui  $\mathcal{L}(v) = 0$  aos conceitos primitivos, ordenando todas as notas derivadas em estratos monotónicos crescentes. Subsequentemente, quando um LLM é invocado para sintetizar, validar ou expandir uma nota alvo  $v_{\text{target}}$ , o construtor de *prompt* realiza uma busca nos predecessores de  $v_{\text{target}}$  na qual as dependências percorridas via arestas `STRICT_DEDUCTIVE` são ordenadas crescentemente pelo seu estrato  $\mathcal{L}(u)$  — desde os axiomas de nível  $0$  até às premissas imediatas de nível  $\mathcal{L}(v_{\text{target}}) - 1$  — e injetadas no bloco fundacional estrito. Em contrapartida, quaisquer conexões incidentes marcadas como `ASSOCIATIVE_FEEDBACK`, nas quais o utilizador fechou acidentalmente um ciclo, são recolhidas sem recursão e injetadas num bloco separado de referências associativas não-fundacionais, eliminando alucinações por circularidade lógica sem sacrificar o contexto semântico da nota original.

## Teoria dos Grafos de Teorias (MMT) e Resolução de Âncoras de Fronteira

### Identificação Zero-Overhead de Primitivos Locais e Extração Cirúrgica de Morfismos de Inclusão

No formalismo **MMT (*Module System for Mathematical Theories*)**, desenvolvido por Florian Rabe e Michael Kohlhase sobre o padrão OMDoc, o conhecimento é estruturado em quatro níveis ontológicos: Documento (*Document*), Módulo (*Module*), Símbolo (*Symbol*) e Objeto (*Object*). Os Domínios ou Campos do sistema de notas correspondem ao nível de **Módulo (Teorias  $\Sigma$ )**, enquanto as notas conceituais (*I-nodes*) e os esquemas de definição ou inferência (*S-nodes*) correspondem a **Declarações de Símbolos (Constantes com tipo e/ou definiens)** no interior de uma teoria. Os links que conectam símbolos de uma teoria origem  $\Sigma_A$  a uma teoria destino  $\Sigma_B$  induzem **Morfismos de Teoria** ( $\sigma: \Sigma_A \to \Sigma_B$ ), que se manifestam como **Morfismos de Inclusão** ( $\Sigma_A \hookrightarrow \Sigma_B$ , representando importações diretas de sub-teorias) ou **Vistas (*Views*)**, que atuam como traduções interpretativas mapeando axiomas de  $\Sigma_A$  em teoremas de  $\Sigma_B$ .

Em sistemas formais tradicionais, avaliar o contexto completo de uma teoria que importa outras teorias exige um processo de **Achatamento (*Flattening*)**, copiando todas as declarações importadas para o espaço de nomes local. Contudo, como demonstrado por Rabe e Kohlhase, o achatamento ansioso (*eager flattening*, análogo à avaliação *call-by-value*) provoca uma explosão exponencial de memória em grafos de teorias densamente interligados. A solução arquitetural recomendada pelo paradigma MMT é o **Achatamento Preguiçoso (*Lazy Flattening* ou *call-by-reference*)**, no qual cada declaração mantém a sua identidade canónica no seu domínio de origem e as fronteiras entre domínios são resolvidas por referência através de âncoras.

Para implementar a identificação de **Primitivos Locais** e a extração de **Âncoras de Fronteira (*Boundary Anchors*)** com **zero overhead** em tempo de execução — atingindo complexidade  $\mathcal{O}(1)$  por consulta de nó ou morfismo sem varredura do grafo global nem alocação de *strings* —, realiza-se o particionamento de graus em tempo de ingestão (*Intra-Domain* versus *Inter-Domain*). Cada Domínio ou Campo recebe um identificador inteiro denso de 16 bits (`domainId: uint16`) e, para cada vértice  $u \in V$ , em vez de se armazenar apenas um grau de entrada escalar  $d^-(u)$ , os contadores de adjacência são particionados em quatro registos inteiros mantidos incrementalmente na inserção ou remoção de arestas:  $d^-_{\text{intra}}(u)$  para arestas de entrada ativas cuja origem pertence ao mesmo domínio ( $\text{domain}(w) = \text{domain}(u)$ );  $d^-_{\text{inter}}(u)$  para arestas de entrada ativas cuja origem pertence a um domínio externo ( $\text{domain}(w) \neq \text{domain}(u)$ ); e, analogamente,  $d^+_{\text{intra}}(u)$  e  $d^+_{\text{inter}}(u)$  para as arestas de saída.

Com esta estrutura de dados pré-particionada, a classificação topológica e modular de qualquer *I-node*  $u$  num domínio  $\Sigma$  reduz-se a comparações inteiras imediatas em  $\mathcal{O}(1)$ . Paralelamente, toda aresta  $(u, v)$  que cruza a fronteira entre dois domínios ( $\text{domain}(u) = A \neq B = \text{domain}(v)$ ) é registada num **Índice de Corte de Fronteira (*Boundary Cut Index*)**, implementado como uma tabela de dispersão indexada pela chave inteira de 32 bits `morphismKey = (domainId_A << 16) | domainId_B`. Assim, extrair cirurgicamente o **Morfismo de Inclusão**  $\iota_{A \hookrightarrow B}: \Sigma_A \to \Sigma_B$  — isto é, a assinatura exata de todos os símbolos exportados por  $\Sigma_A$  que sustentam definições em  $\Sigma_B$ , correspondendo ao *cone de dependência direta de um passo* (*one-step forward dependency cone*) definido no MMT — executa-se em tempo  $\mathcal{O}(1)$  para localizar o morfismo e  $\mathcal{O}(|\partial(A \to B)|)$  para iterar exclusivamente sobre as arestas que efetivamente cruzam a fronteira  $A \to B$ , com custo zero sobre o restante do grafo.

| Classe Epistémica Modular (MMT / AIF) | Condição Algébrica nos Registos de Grau (O(1)\mathcal{O}(1)O(1)) | Papel Semântico no Grafo de Teorias |
| --- | --- | --- |
| Primitivo Local Absoluto (Axioma Nativo) | u∈VI(Σ)∧dintra−(u)=0∧dinter−(u)=0u \in V_I(\Sigma) \land d^-_{\text{intra}}(u) = 0 \land d^-_{\text{inter}}(u) = 0u∈VI​(Σ)∧dintra−​(u)=0∧dinter−​(u)=0 | Conceito fundacional definido axiomaticamente em Σ\SigmaΣ sem dependências internas ou externas (L(u)=0\mathcal{L}(u) = 0L(u)=0). |
| Primitivo Relativo Local (Ancorado Externamente) | u∈VI(Σ)∧dintra−(u)=0∧dinter−(u)>0u \in V_I(\Sigma) \land d^-_{\text{intra}}(u) = 0 \land d^-_{\text{inter}}(u) > 0u∈VI​(Σ)∧dintra−​(u)=0∧dinter−​(u)>0 | Ponto de partida interno em Σ\SigmaΣ cuja fundamentação reside num morfismo de inclusão proveniente de outra teoria Σ′\Sigma'Σ′. |
| Âncora de Fronteira Exportada (Exported Anchor) | u∈VI(ΣA)∧dinter+(u)>0u \in V_I(\Sigma_A) \land d^+_{\text{inter}}(u) > 0u∈VI​(ΣA​)∧dinter+​(u)>0 | Símbolo público da teoria ΣA\Sigma_AΣA​ referenciado como premissa por pelo menos um esquema noutra teoria ΣB\Sigma_BΣB​. |
| Âncora de Fronteira Importada (Imported Anchor) | v∈VI(ΣB)∧dinter−(v)>0v \in V_I(\Sigma_B) \land d^-_{\text{inter}}(v) > 0v∈VI​(ΣB​)∧dinter−​(v)>0 (direta ou via s∈VS(ΣB)s \in V_S(\Sigma_B)s∈VS​(ΣB​)) | Símbolo receptor em ΣB\Sigma_BΣB​ cuja definição depende cirurgicamente de uma âncora exportada por ΣA\Sigma_AΣA​. |

### Padrão de URI Canónico Tripartido (MMT-URI) e Prevenção de Colisões

Em cofres locais de PKM, colisões homónimas são inevitáveis: o símbolo `Produto`, `Normal`, `Grupo` ou `Dual` pode existir simultaneamente nos campos `Algebra/TeoriaDeGrupos`, `Analise/EspacosNormados` e `TeoriaDasCategorias`. Utilizar apenas o nome do ficheiro Markdown ao estilo *WikiLink* clássico (`[[Normal]]`) provoca colisões catastróficas no espaço de nomes, enquanto utilizar caminhos físicos de ficheiros combinados com fragmentos HTML (`file:///vault/algebra/grupos.md#Normal`) viola a transparência semântica de documentos. Como demonstrado por Rabe, Kohlhase e Zholudev, o padrão OpenMath impõe a restrição rígida de um dicionário de conteúdo por ficheiro, e o OMDoc 1.2 exige identificadores únicos a nível de ficheiro usando o delimitador `#`, o que impede a refatoração física de pastas e o aninhamento modular de teorias.

Para erradicar colisões e desacoplar a localização física em disco da hierarquia lógica de domínios, adota-se o padrão canónico **MMT-URI Tripartido** em estrita conformidade com a **RFC 3986**:

$$ \text{MMT-URI} ::= \underbrace{\text{doc}}_{\text{URI do Documento/Pacote}} \mathbf{?} \underbrace{\text{mod}}_{\text{Caminho do Módulo/Domínio}} \mathbf{?} \underbrace{\text{sym}}_{\text{Nome Qualificado do Símbolo}} $$

Na gramática MMT/OMDoc, o primeiro segmento `doc` constitui o identificador lógico de pacote ou documento sem *query* ou *fragment* (por exemplo, `pkm://vault/matematica/algebra` ou `http://cds.omdoc.org/math/algebra.omdoc`), identificando o pacote lógico onde o conjunto de teorias reside de modo transparente à semântica lógica. O segundo segmento `mod` representa o caminho hierárquico do módulo ou teoria através de uma sequência de nomes locais separados por `/` (`mod_1/mod_2/.../mod_k`), especificando o caminho para uma teoria ou sub-teoria aninhada dentro do documento `doc`, tal como `Anel/Comutativo` ou `TeoriaDeGrupos`. O terceiro segmento `sym` codifica o identificador qualificado de símbolo ou instância de morfismo como uma sequência de nomes locais separados por `/` na forma `imp_1/imp_2/.../imp_n/con`, onde cada prefixo `imp_i` designa um morfismo de importação ou estrutura nomeada e `con` é o nome local da declaração atómica (*I-node* ou *S-node*, como `mult/mon/identidade` ou `SubgrupoNormal`). Cada nome local obedece estritamente à produção `pchar+` da RFC 3986, permitindo caracteres alfanuméricos, `-`, `.`, `_`, `~`, sub-delimitadores e, via codificação percentual `%XX`, todo o repertório Unicode. O uso de dois caracteres de interrogação (`?`) num único URI (`doc?mod?sym`), embora incomum fora do ecossistema MMT, é estritamente legal segundo a RFC 3986, dado que o primeiro `?` inicia a componente *query* do URI e o segundo `?` atua como um caractere perfeitamente válido no interior dessa componente.

Esta estrutura tripartida viabiliza a propriedade de **Desaninhamento de Declarações (*Unnesting of Declarations*)**: como toda nota (*I-node*) e todo esquema (*S-node*) possui um MMT-URI canónico globalmente único, qualquer declaração pode ser extraída do seu ficheiro físico e processada incrementalmente fora de contexto sem perder a sua ligação algébrica ao seu domínio `mod`. Adicionalmente, o sistema suporta a **Resolução de MMT-URIs Relativos**, estendendo a RFC 3986 (e superando as limitações da antiga RFC 2396) para resolver referências concisas contra o URI contenedor `doc?mod?sym`:

| Sintaxe de Referência no Markdown | Tipo de Escopo Relativo MMT | Regra de Resolução contra doc?mod?sym | URI Canónico Resultante | Caso de Uso no Cofre de PKM |
| --- | --- | --- | --- | --- |
| ??sym0 | Intra-Domínio (Mesma Teoria) | Mantém doc e mod; substitui apenas sym por sym0 | doc?mod?sym0 | Link rápido entre notas dentro do mesmo Campo/Domínio ([[??Subgrupo]]). |
| ?/mod0?sym0 | Sub-Domínio Aninhado | Mantém doc; concatena /mod0 ao módulo atual mod | doc?mod/mod0?sym0 | Referência de uma teoria geral para uma especialização aninhada (Anel →\to→ Anel/Abeliano). |
| ?mod0?sym0 | Inter-Domínio (Mesmo Pacote) | Mantém doc; substitui mod por mod0 e sym por sym0 | doc?mod0?sym0 | Morfismo de inclusão entre campos irmãos no mesmo pacote (?EspacosVetoriais?Base). |
| doc0?mod0?sym0 | Inter-Pacote Absoluto | Substituição integral (URI já canónico) | doc0?mod0?sym0 | Importação de fronteira cruzando pacotes distintos (pkm://vault/logica?FOL?Igualdade). |

## Especificação Algorítmica e Implementação TypeScript para Produção

A implementação a seguir fornece o motor completo pronto para produção em TypeScript, estritamente tipado e sem dependências externas, utilizando estruturas baseadas em *TypedArrays* e listas duplamente ligadas intrusivas para assegurar complexidade temporal e espacial  $\mathcal{O}(|V| + |E|)$ . O código integra o analisador, validador e resolvedor de **MMT-URIs Tripartidos (`doc?mod?sym`)** compatível com a RFC 3986, o motor de grafo bipartido AIF com decomposição **Tarjan SCC** e a **Heurística de Eades (`GreedyFAS`)** com *buckets* de prioridade bipartida ( $V_I \succ V_S$ ) e despromoção não-destrutiva em memória, bem como o extrator **Zero-Overhead de Primitivos Locais, Âncoras de Fronteira e Morfismos de Inclusão**, acompanhado do calculador de níveis topológicos e montador de contexto para LLMs.

TypeScript

```
/**
 * ============================================================================
 * ARQUITETURA DE REDE EPISTÉMICA ACÍCLICA (AIF + MMT THEORY GRAPHS)
 * Especificação de Produção: Eades GreedyFAS Bipartido & Resolução MMT-URI
 * Complexidade Global: Tempo O(|V| + |E|) | Espaço Auxiliar O(|V| + |E|)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. TIPOS FUNDAMENTAIS E ONTOLOGIA AIF / MMT
// ----------------------------------------------------------------------------

export enum AIFNodePartition {
  /** Nó de Informação (I-node): Nota conceitual atómica, axioma ou proposição */
  I_NODE = 0,
  /** Nó de Esquema (S-node): Aplicação de regra de inferência/definição (RA/CA/PA) */
  S_NODE = 1,
}

export enum AIFSchemeSubType {
  NONE = 0,
  /** Rule Application (RA-node): Definição dedutiva ou inferência construtiva */
  RA_DEFINITION = 1,
  /** Conflict Application (CA-node): Objeção ou incompatibilidade lógica */
  CA_CONFLICT = 2,
  /** Preference Application (PA-node): Preferência epistémica entre alternativas */
  PA_PREFERENCE = 3,
}

export enum AIFEdgeType {
  /** Data Edge (I-to-S): Fornece uma nota premissa a um esquema S-node */
  DATA_SUPPLYING_I_TO_S = 0,
  /** Scheme Edge (S-to-I): Conecta o esquema S-node à nota conclusão I-node */
  CONCLUSION_S_TO_I = 1,
}

export enum EpistemicEdgeRole {
  /** Aresta dedutiva estrita ativa na projeção acíclica (DAG) */
  STRICT_DEDUCTIVE = 0,
  /** Aresta de retorno (Feedback Arc) rebaixada em memória para link associativo */
  ASSOCIATIVE_FEEDBACK = 1,
}

export interface TripartiteMMTUri {
  /** URI base do pacote/documento sem query ou fragment (ex: pkm://vault/math) */
  readonly doc: string;
  /** Caminho de módulos/teorias separado por '/' (ex: Algebra/GroupTheory) */
  readonly mod: string;
  /** Nome qualificado do símbolo ou instância (ex: mult/mon/Identity) */
  readonly sym: string;
  /** Representação canónica serializada: doc?mod?sym */
  readonly canonical: string;
  /** Identificador canónico da Teoria/Domínio: doc?mod */
  readonly theoryUri: string;
}

export interface EpistemicNodeDescriptor {
  readonly internalId: number;
  readonly uri: TripartiteMMTUri;
  readonly domainId: number;
  readonly partition: AIFNodePartition;
  readonly schemeSubType: AIFSchemeSubType;
  readonly physicalFilePath: string;
  readonly markdownExcerpt: string;
}

export interface EpistemicEdgeDescriptor {
  readonly edgeId: number;
  readonly sourceId: number;
  readonly targetId: number;
  readonly edgeType: AIFEdgeType;
  readonly weight: number;
  /** Papel epistémico mutável apenas na camada de sobreposição em memória */
  epistemicRole: EpistemicEdgeRole;
}

export interface BoundaryAnchorReport {
  readonly theoryUri: string;
  readonly domainId: number;
  /** I-nodes sem dependências internas nem externas (d^-_intra = 0 e d^-_inter = 0) */
  readonly absoluteLocalPrimitives: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes sem dependências internas, mas fundamentados via morfismo externo */
  readonly externallyGroundedPrimitives: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes deste domínio que servem de premissa para outros domínios */
  readonly exportedBoundaryAnchors: ReadonlyArray<EpistemicNodeDescriptor>;
  /** I-nodes deste domínio que dependem diretamente de outros domínios */
  readonly importedBoundaryAnchors: ReadonlyArray<EpistemicNodeDescriptor>;
}

export interface InclusionMorphismDescriptor {
  readonly sourceTheoryUri: string;
  readonly targetTheoryUri: string;
  readonly sourceDomainId: number;
  readonly targetDomainId: number;
  /** Pares cirúrgicos (Âncora Exportada -> Esquema/Âncora Importada) na fronteira */
  readonly frontierBridges: ReadonlyArray<{
    readonly edgeId: number;
    readonly exportedNode: EpistemicNodeDescriptor;
    readonly mediatingOrTargetNode: EpistemicNodeDescriptor;
    readonly epistemicRole: EpistemicEdgeRole;
  }>;
}

export interface DAGProjectionResult {
  readonly feedbackArcSet: ReadonlyArray<EpistemicEdgeDescriptor>;
  readonly linearOrdering: Int32Array;
  readonly topologicalLevels: Int32Array;
  readonly maxTopologicalLevel: number;
  readonly nonTrivialSccCount: number;
}

// ----------------------------------------------------------------------------
// 2. RESOLVEDOR E PARSER DE URIS CANÓNICOS MMT (doc?mod?sym - RFC 3986)
// ----------------------------------------------------------------------------

export class MMTUriResolver {
  // Validação RFC 3986 pchar (excluindo '?' e '#' nos segmentos internos)
  private static readonly LOCAL_PATH_REGEX =
    /^[A-Za-z0-9\-._~!$&'()*+,;=:@%/]+$/;

  /**
   * Analisa um URI canónico MMT no formato tripartido `doc?mod?sym`.
   * Garante ausência de colisões entre campos homónimos.
   */
  public static parseCanonical(rawUri: string): TripartiteMMTUri {
    const trimmed = rawUri.trim();
    const firstQ = trimmed.indexOf("?");
    if (firstQ <= 0) {
      throw new Error(
        `[MMT-URI Inválido] Ausência do delimitador de módulo '?' em: "${rawUri}"`
      );
    }

    const secondQ = trimmed.indexOf("?", firstQ + 1);
    if (secondQ <= firstQ + 1 || secondQ === trimmed.length - 1) {
      throw new Error(
        `[MMT-URI Inválido] Estrutura tripartida 'doc?mod?sym' incompleta em: "${rawUri}"`
      );
    }

    if (trimmed.indexOf("?", secondQ + 1) !== -1 || trimmed.includes("#")) {
      throw new Error(
        `[MMT-URI Inválido] Caracteres '?' excedentes ou fragmento '#' proibido em: "${rawUri}"`
      );
    }

    const doc = trimmed.slice(0, firstQ).replace(/\/+$/, "");
    const mod = this.normalizeSlashPath(trimmed.slice(firstQ + 1, secondQ));
    const sym = this.normalizeSlashPath(trimmed.slice(secondQ + 1));

    if (
      !mod ||
      !sym ||
      !this.LOCAL_PATH_REGEX.test(mod) ||
      !this.LOCAL_PATH_REGEX.test(sym)
    ) {
      throw new Error(
        `[MMT-URI Inválido] Violação léxica RFC 3986 (pchar+) em mod="${mod}" ou sym="${sym}"`
      );
    }

    const theoryUri = `${doc}?${mod}`;
    const canonical = `${theoryUri}?${sym}`;

    return { doc, mod, sym, canonical, theoryUri };
  }

  /**
   * Resolve referências relativas MMT (ex: `??sym0`, `?/mod0?sym0`, `?mod0?sym0`)
   * contra o URI canónico da declaração ou nota contenedora `baseUri`.
   */
  public static resolveRelative(
    baseUri: TripartiteMMTUri,
    reference: string
  ): TripartiteMMTUri {
    const ref = reference.trim();

    // Caso 1: Intra-Teoria `??sym0` -> doc?mod?sym0
    if (ref.startsWith("??")) {
      const sym0 = this.normalizeSlashPath(ref.slice(2));
      return this.parseCanonical(`${baseUri.doc}?${baseUri.mod}?${sym0}`);
    }

    // Caso 2: Sub-Teoria Aninhada `?/mod0?sym0` -> doc?mod/mod0?sym0
    if (ref.startsWith("?/") && !ref.startsWith("??")) {
      const rest = ref.slice(2);
      const qIdx = rest.indexOf("?");
      if (qIdx <= 0) {
        throw new Error(
          `[MMT-URI Relativo Inválido] Esperado '?/mod0?sym0', recebido: "${ref}"`
        );
      }
      const mod0 = this.normalizeSlashPath(rest.slice(0, qIdx));
      const sym0 = this.normalizeSlashPath(rest.slice(qIdx + 1));
      return this.parseCanonical(
        `${baseUri.doc}?${baseUri.mod}/${mod0}?${sym0}`
      );
    }

    // Caso 3: Inter-Teoria no mesmo documento `?mod0?sym0` -> doc?mod0?sym0
    if (ref.startsWith("?")) {
      const rest = ref.slice(1);
      const qIdx = rest.indexOf("?");
      if (qIdx <= 0) {
        throw new Error(
          `[MMT-URI Relativo Inválido] Esperado '?mod0?sym0', recebido: "${ref}"`
        );
      }
      const mod0 = this.normalizeSlashPath(rest.slice(0, qIdx));
      const sym0 = this.normalizeSlashPath(rest.slice(qIdx + 1));
      return this.parseCanonical(`${baseUri.doc}?${mod0}?${sym0}`);
    }

    // Caso 4: URI Absoluto Completo `doc0?mod0?sym0`
    return this.parseCanonical(ref);
  }

  private static normalizeSlashPath(segment: string): string {
    return segment
      .split("/")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join("/");
  }
}

// ----------------------------------------------------------------------------
// 3. MOTOR DE GRAFO EPISTÉMICO BIPARTIDO AIF & QUEBRA DE CICLOS DE EADES
// ----------------------------------------------------------------------------

export class EpistemicAIFEngine {
  private nodes: EpistemicNodeDescriptor[] = [];
  private edges: EpistemicEdgeDescriptor[] = [];
  private uriToNodeId: Map<string, number> = new Map();

  // Internamento de Domínios (Theory Modules) para operações O(1)
  private theoryUriToDomainId: Map<string, number> = new Map();
  private domainIdToTheoryUri: string[] = [];
  private domainNodes: number[][] = [];

  // Listas de adjacência em memória (armazenam edgeIds)
  private outEdgeIds: number[][] = [];
  private inEdgeIds: number[][] = [];

  // Contadores de Grau Particionados (Zero-Overhead Boundary Detection)
  private intraInDeg: number[] = [];
  private interInDeg: number[] = [];
  private intraOutDeg: number[] = [];
  private interOutDeg: number[] = [];

  // Índice Cirúrgico de Corte de Fronteira: chave `(srcDomain << 16) | dstDomain` -> edgeIds[]
  private boundaryCutIndex: Map<number, number[]> = new Map();

  /**
   * Regista ou recupera o identificador inteiro de 16 bits de um Domínio (Teoria MMT).
   */
  private getOrRegisterDomainId(theoryUri: string): number {
    let domainId = this.theoryUriToDomainId.get(theoryUri);
    if (domainId === undefined) {
      domainId = this.domainIdToTheoryUri.length;
      if (domainId > 0xffff) {
        throw new Error("Limite de 65.535 domínios excedido para chave de 32 bits.");
      }
      this.theoryUriToDomainId.set(theoryUri, domainId);
      this.domainIdToTheoryUri.push(theoryUri);
      this.domainNodes.push([]);
    }
    return domainId;
  }

  /**
   * Adiciona um nó (I-node ou S-node) à Rede Epistémica em memória.
   */
  public addNode(params: {
    rawUri: string;
    partition: AIFNodePartition;
    schemeSubType?: AIFSchemeSubType;
    physicalFilePath: string;
    markdownExcerpt: string;
  }): EpistemicNodeDescriptor {
    const parsedUri = MMTUriResolver.parseCanonical(params.rawUri);
    const existingId = this.uriToNodeId.get(parsedUri.canonical);
    if (existingId !== undefined) {
      return this.nodes[existingId];
    }

    const internalId = this.nodes.length;
    const domainId = this.getOrRegisterDomainId(parsedUri.theoryUri);

    const descriptor: EpistemicNodeDescriptor = {
      internalId,
      uri: parsedUri,
      domainId,
      partition: params.partition,
      schemeSubType:
        params.schemeSubType ??
        (params.partition === AIFNodePartition.S_NODE
          ? AIFSchemeSubType.RA_DEFINITION
          : AIFSchemeSubType.NONE),
      physicalFilePath: params.physicalFilePath,
      markdownExcerpt: params.markdownExcerpt,
    };

    this.nodes.push(descriptor);
    this.uriToNodeId.set(parsedUri.canonical, internalId);
    this.domainNodes[domainId].push(internalId);

    this.outEdgeIds.push([]);
    this.inEdgeIds.push([]);
    this.intraInDeg.push(0);
    this.interInDeg.push(0);
    this.intraOutDeg.push(0);
    this.interOutDeg.push(0);

    return descriptor;
  }

  /**
   * Adiciona uma aresta direcionada impondo a invariante bipartida estrita do AIF:
   * I-to-I é estritamente proibido. Toda conexão entre I-nodes passa por um S-node.
   */
  public addBipartiteEdge(
    sourceUriOrId: string | number,
    targetUriOrId: string | number,
    weight: number = 1
  ): EpistemicEdgeDescriptor {
    const u =
      typeof sourceUriOrId === "number"
        ? sourceUriOrId
        : this.uriToNodeId.get(
            MMTUriResolver.parseCanonical(sourceUriOrId).canonical
          );
    const v =
      typeof targetUriOrId === "number"
        ? targetUriOrId
        : this.uriToNodeId.get(
            MMTUriResolver.parseCanonical(targetUriOrId).canonical
          );

    if (u === undefined || v === undefined) {
      throw new Error(
        `[Erro de Integridade AIF] Vértice origem ou destino inexistente.`
      );
    }

    const nodeU = this.nodes[u];
    const nodeV = this.nodes[v];

    // Verificação estrita da restrição bipartida AIF
    if (
      nodeU.partition === AIFNodePartition.I_NODE &&
      nodeV.partition === AIFNodePartition.I_NODE
    ) {
      throw new Error(
        `[Violação Ontológica AIF] Aresta direta I-to-I proibida entre "${nodeU.uri.canonical}" e "${nodeV.uri.canonical}". Utilize um S-node mediador.`
      );
    }

    if (
      nodeU.partition === AIFNodePartition.S_NODE &&
      nodeV.partition === AIFNodePartition.S_NODE
    ) {
      throw new Error(
        `[Violação Bipartida] Aresta direta S-to-S desativada na projeção bipartida estrita entre "${nodeU.uri.canonical}" e "${nodeV.uri.canonical}".`
      );
    }

    const edgeType =
      nodeU.partition === AIFNodePartition.I_NODE
        ? AIFEdgeType.DATA_SUPPLYING_I_TO_S
        : AIFEdgeType.CONCLUSION_S_TO_I;

    const edgeId = this.edges.length;
    const edge: EpistemicEdgeDescriptor = {
      edgeId,
      sourceId: u,
      targetId: v,
      edgeType,
      weight,
      epistemicRole: EpistemicEdgeRole.STRICT_DEDUCTIVE,
    };

    this.edges.push(edge);
    this.outEdgeIds[u].push(edgeId);
    this.inEdgeIds[v].push(edgeId);

    // Atualização O(1) dos contadores Intra-Domínio vs. Inter-Domínio
    if (nodeU.domainId === nodeV.domainId) {
      this.intraOutDeg[u]++;
      this.intraInDeg[v]++;
    } else {
      this.interOutDeg[u]++;
      this.interInDeg[v]++;
      const morphismKey = (nodeU.domainId << 16) | nodeV.domainId;
      let cutList = this.boundaryCutIndex.get(morphismKey);
      if (!cutList) {
        cutList = [];
        this.boundaryCutIndex.set(morphismKey, cutList);
      }
      cutList.push(edgeId);
    }

    return edge;
  }

  /**
   * Executa a quebra de ciclos não-destrutiva em memória utilizando:
   * 1. Isolamento de Componentes Fortemente Conexos (Tarjan SCC) em O(V + E).
   * 2. Heurística de Eades, Lin & Smyth (GreedyFAS) com Buckets O(V + E) e
   *    prioridade de partição bipartida (V_I > V_S) para proteger a aridade dos S-nodes.
   * 3. Estratificação topológica de Kahn sobre a projeção DAG resultante.
   */
  public buildAcyclicEpistemicProjection(): DAGProjectionResult {
    const n = this.nodes.length;
    const m = this.edges.length;

    // Passo 0: Restaurar todas as arestas para STRICT_DEDUCTIVE antes do cálculo
    for (let e = 0; e < m; e++) {
      this.edges[e].epistemicRole = EpistemicEdgeRole.STRICT_DEDUCTIVE;
    }

    // Passo 1: Decomposição em Componentes Fortemente Conexos (Tarjan iterativo/recursivo)
    const sccs = this.computeNonTrivialSCCs();
    const feedbackArcSet: EpistemicEdgeDescriptor[] = [];

    // Vetor auxiliar para mapear a posição local na sequência linear s = s1 || s2
    const localOrderPos = new Int32Array(n).fill(-1);

    // Buffers reutilizáveis ao nível do grafo para evitar realocações por SCC
    const activeMask = new Uint8Array(n);
    const localInDeg = new Int32Array(n);
    const localOutDeg = new Int32Array(n);
    const prevInBucket = new Int32Array(n).fill(-1);
    const nextInBucket = new Int32Array(n).fill(-1);

    // Passo 2: Executar Eades Bipartido estritamente sobre cada SCC não-trivial
    for (let c = 0; c < sccs.length; c++) {
      const component = sccs[c];
      const compSize = component.length;

      let maxDeg = 0;
      for (let i = 0; i < compSize; i++) {
        activeMask[component[i]] = 1;
      }

      // Calcular graus induzidos exclusivamente dentro do SCC atual
      for (let i = 0; i < compSize; i++) {
        const u = component[i];
        let dOut = 0;
        const outE = this.outEdgeIds[u];
        for (let j = 0; j < outE.length; j++) {
          const target = this.edges[outE[j]].targetId;
          if (activeMask[target] === 1) dOut++;
        }

        let dIn = 0;
        const inE = this.inEdgeIds[u];
        for (let j = 0; j < inE.length; j++) {
          const source = this.edges[inE[j]].sourceId;
          if (activeMask[source] === 1) dIn++;
        }

        localOutDeg[u] = dOut;
        localInDeg[u] = dIn;
        if (dOut > maxDeg) maxDeg = dOut;
        if (dIn > maxDeg) maxDeg = dIn;
      }

      // Estrutura de Buckets indexada por delta(u) = d+(u) - d-(u) em [-maxDeg, +maxDeg]
      const offset = maxDeg;
      const numBuckets = 2 * maxDeg + 1;
      const bucketHead = new Int32Array(numBuckets).fill(-1);
      const bucketTail = new Int32Array(numBuckets).fill(-1);

      const sinkStack: number[] = [];
      const sourceQueue: number[] = [];

      const insertIntoBucket = (u: number, delta: number): void => {
        const bIdx = delta + offset;
        prevInBucket[u] = -1;
        nextInBucket[u] = -1;

        if (bucketHead[bIdx] === -1) {
          bucketHead[bIdx] = u;
          bucketTail[bIdx] = u;
        } else if (this.nodes[u].partition === AIFNodePartition.I_NODE) {
          // Prioridade Bipartida: I-nodes entram na CABEÇA do bucket (extraídos primeiro)
          const oldHead = bucketHead[bIdx];
          nextInBucket[u] = oldHead;
          prevInBucket[oldHead] = u;
          bucketHead[bIdx] = u;
        } else {
          // S-nodes entram na CAUDA do bucket (preservando as suas premissas I-to-S)
          const oldTail = bucketTail[bIdx];
          prevInBucket[u] = oldTail;
          nextInBucket[oldTail] = u;
          bucketTail[bIdx] = u;
        }
      };

      const removeFromBucket = (u: number, delta: number): void => {
        const bIdx = delta + offset;
        const prev = prevInBucket[u];
        const next = nextInBucket[u];

        if (prev !== -1) {
          nextInBucket[prev] = next;
        } else {
          bucketHead[bIdx] = next;
        }

        if (next !== -1) {
          prevInBucket[next] = prev;
        } else {
          bucketTail[bIdx] = prev;
        }

        prevInBucket[u] = -1;
        nextInBucket[u] = -1;
      };

      let maxBucketIdx = 0;

      // População inicial dos buckets e filas de fontes/sorvedouros
      for (let i = 0; i < compSize; i++) {
        const u = component[i];
        if (localOutDeg[u] === 0) {
          activeMask[u] = 2; // Marcado em fila de sorvedouro/fonte
          sinkStack.push(u);
        } else if (localInDeg[u] === 0) {
          activeMask[u] = 2;
          sourceQueue.push(u);
        } else {
          const delta = localOutDeg[u] - localInDeg[u];
          insertIntoBucket(u, delta);
          if (delta + offset > maxBucketIdx) {
            maxBucketIdx = delta + offset;
          }
        }
      }

      // Sequências s1 (esquerda) e s2 (direita, guardada invertida e revertida no final)
      const s1: number[] = [];
      const s2Reversed: number[] = [];

      const removeNodeAndUpdateNeighbors = (u: number): void => {
        activeMask[u] = 0;

        // Atualizar vizinhos de entrada (reduz d+(v) de cada predecessor ativo v)
        const inE = this.inEdgeIds[u];
        for (let j = 0; j < inE.length; j++) {
          const v = this.edges[inE[j]].sourceId;
          if (activeMask[v] === 1) {
            const oldDelta = localOutDeg[v] - localInDeg[v];
            removeFromBucket(v, oldDelta);
            localOutDeg[v]--;

            if (localOutDeg[v] === 0) {
              activeMask[v] = 2;
              sinkStack.push(v);
            } else {
              const newDelta = localOutDeg[v] - localInDeg[v];
              insertIntoBucket(v, newDelta);
              if (newDelta + offset > maxBucketIdx) {
                maxBucketIdx = newDelta + offset;
              }
            }
          }
        }

        // Atualizar vizinhos de saída (reduz d-(w) de cada sucessor ativo w)
        const outE = this.outEdgeIds[u];
        for (let j = 0; j < outE.length; j++) {
          const w = this.edges[outE[j]].targetId;
          if (activeMask[w] === 1) {
            const oldDelta = localOutDeg[w] - localInDeg[w];
            removeFromBucket(w, oldDelta);
            localInDeg[w]--;

            if (localInDeg[w] === 0) {
              activeMask[w] = 2;
              sourceQueue.push(w);
            } else {
              const newDelta = localOutDeg[w] - localInDeg[w];
              insertIntoBucket(w, newDelta);
              if (newDelta + offset > maxBucketIdx) {
                maxBucketIdx = newDelta + offset;
              }
            }
          }
        }
      };

      let remaining = compSize;
      let sourceHead = 0;

      // Laço Principal da Heurística de Eades (GreedyFAS)
      while (remaining > 0) {
        // 2.1 Poda iterativa de todos os sorvedouros (Sinks -> prefixados em s2)
        while (sinkStack.length > 0) {
          const u = sinkStack.pop()!;
          if (activeMask[u] === 0) continue;
          s2Reversed.push(u);
          removeNodeAndUpdateNeighbors(u);
          remaining--;
        }

        // 2.2 Poda iterativa de todas as fontes (Sources -> anexadas em s1)
        while (sourceHead < sourceQueue.length) {
          const u = sourceQueue[sourceHead++];
          if (activeMask[u] === 0) continue;
          s1.push(u);
          removeNodeAndUpdateNeighbors(u);
          remaining--;
          // Se a remoção de uma fonte gerou novos sorvedouros, priorizar a poda de sorvedouros
          if (sinkStack.length > 0) break;
        }

        if (sinkStack.length > 0 || sourceHead < sourceQueue.length) {
          continue;
        }

        // 2.3 Escolha Gulosa: extrair vértice u* com máximo delta(u) = d+(u) - d-(u)
        if (remaining > 0) {
          while (maxBucketIdx >= 0 && bucketHead[maxBucketIdx] === -1) {
            maxBucketIdx--;
          }
          if (maxBucketIdx >= 0) {
            const uStar = bucketHead[maxBucketIdx];
            const deltaStar = maxBucketIdx - offset;
            removeFromBucket(uStar, deltaStar);
            s1.push(uStar);
            removeNodeAndUpdateNeighbors(uStar);
            remaining--;
          }
        }
      }

      // Concatenar s = s1 || s2 e registar a posição linear de cada vértice do SCC
      let rank = 0;
      for (let i = 0; i < s1.length; i++) {
        localOrderPos[s1[i]] = rank++;
      }
      for (let i = s2Reversed.length - 1; i >= 0; i--) {
        localOrderPos[s2Reversed[i]] = rank++;
      }

      // Identificar e rebaixar não-destrutivamente as arestas de retorno (pi(u) > pi(v))
      for (let i = 0; i < compSize; i++) {
        const u = component[i];
        const posU = localOrderPos[u];
        const outE = this.outEdgeIds[u];
        for (let j = 0; j < outE.length; j++) {
          const edge = this.edges[outE[j]];
          const v = edge.targetId;
          // Verificar se v pertence ao mesmo SCC (ambos têm pos >= 0 definida nesta iteração)
          if (localOrderPos[v] !== -1 && posU > localOrderPos[v]) {
            edge.epistemicRole = EpistemicEdgeRole.ASSOCIATIVE_FEEDBACK;
            feedbackArcSet.push(edge);
          }
        }
      }

      // Limpar localOrderPos do SCC atual em O(compSize)
      for (let i = 0; i < compSize; i++) {
        localOrderPos[component[i]] = -1;
      }
    }

    // Passo 3: Cálculo de Níveis Topológicos e Ordenação Global sobre o DAG Projetado
    const dagInDeg = new Int32Array(n);
    for (let e = 0; e < m; e++) {
      const edge = this.edges[e];
      if (edge.epistemicRole === EpistemicEdgeRole.STRICT_DEDUCTIVE) {
        dagInDeg[edge.targetId]++;
      }
    }

    const topologicalLevels = new Int32Array(n).fill(0);
    const linearOrdering = new Int32Array(n);
    const kahnQueue = new Int32Array(n);
    let qHead = 0;
    let qTail = 0;

    for (let u = 0; u < n; u++) {
      if (dagInDeg[u] === 0) {
        kahnQueue[qTail++] = u;
      }
    }

    let maxTopologicalLevel = 0;
    let orderIdx = 0;

    while (qHead < qTail) {
      const u = kahnQueue[qHead++];
      linearOrdering[orderIdx++] = u;
      const nextLevel = topologicalLevels[u] + 1;

      const outE = this.outEdgeIds[u];
      for (let j = 0; j < outE.length; j++) {
        const edge = this.edges[outE[j]];
        if (edge.epistemicRole !== EpistemicEdgeRole.STRICT_DEDUCTIVE) continue;

        const v = edge.targetId;
        if (nextLevel > topologicalLevels[v]) {
          topologicalLevels[v] = nextLevel;
          if (nextLevel > maxTopologicalLevel) {
            maxTopologicalLevel = nextLevel;
          }
        }

        dagInDeg[v]--;
        if (dagInDeg[v] === 0) {
          kahnQueue[qTail++] = v;
        }
      }
    }

    return {
      feedbackArcSet,
      linearOrdering,
      topologicalLevels,
      maxTopologicalLevel,
      nonTrivialSccCount: sccs.length,
    };
  }

  /**
   * Extrai em tempo O(|V_dominio|) os Primitivos Locais e as Âncoras de Fronteira
   * de um Domínio (Teoria MMT) utilizando os contadores pré-particionados (Zero-Overhead).
   */
  public inspectDomainBoundary(theoryUri: string): BoundaryAnchorReport {
    const domainId = this.theoryUriToDomainId.get(theoryUri);
    if (domainId === undefined) {
      throw new Error(`[MMT Theory Graph] Domínio desconhecido: "${theoryUri}"`);
    }

    const nodeIds = this.domainNodes[domainId];
    const absoluteLocalPrimitives: EpistemicNodeDescriptor[] = [];
    const externallyGroundedPrimitives: EpistemicNodeDescriptor[] = [];
    const exportedBoundaryAnchors: EpistemicNodeDescriptor[] = [];
    const importedBoundaryAnchors: EpistemicNodeDescriptor[] = [];

    for (let i = 0; i < nodeIds.length; i++) {
      const u = nodeIds[i];
      const node = this.nodes[u];

      // Classificação de Primitivos e Âncoras aplica-se aos conceitos (I-nodes)
      if (node.partition === AIFNodePartition.I_NODE) {
        const dInIntra = this.intraInDeg[u];
        const dInInter = this.interInDeg[u];
        const dOutInter = this.interOutDeg[u];

        // Verifica também se o S-node definidor imediato de 'u' recebe premissas externas
        let hasExternalSchemePremise = dInInter > 0;
        let hasInternalSchemePremise = dInIntra > 0;

        const inE = this.inEdgeIds[u];
        for (let j = 0; j < inE.length; j++) {
          const sNodeId = this.edges[inE[j]].sourceId;
          if (this.interInDeg[sNodeId] > 0) hasExternalSchemePremise = true;
          if (this.intraInDeg[sNodeId] > 0) hasInternalSchemePremise = true;
        }

        if (!hasInternalSchemePremise && !hasExternalSchemePremise) {
          absoluteLocalPrimitives.push(node);
        } else if (!hasInternalSchemePremise && hasExternalSchemePremise) {
          externallyGroundedPrimitives.push(node);
        }

        if (hasExternalSchemePremise) {
          importedBoundaryAnchors.push(node);
        }

        // Verifica se 'u' alimenta diretamente um S-node noutro domínio ou um S-node local que exporta
        let exportsAcrossBoundary = dOutInter > 0;
        if (!exportsAcrossBoundary) {
          const outE = this.outEdgeIds[u];
          for (let j = 0; j < outE.length; j++) {
            const sNodeId = this.edges[outE[j]].targetId;
            if (this.interOutDeg[sNodeId] > 0) {
              exportsAcrossBoundary = true;
              break;
            }
          }
        }

        if (exportsAcrossBoundary) {
          exportedBoundaryAnchors.push(node);
        }
      }
    }

    return {
      theoryUri,
      domainId,
      absoluteLocalPrimitives,
      externallyGroundedPrimitives,
      exportedBoundaryAnchors,
      importedBoundaryAnchors,
    };
  }

  /**
   * Extração cirúrgica O(1) + O(|fronteira|) do Morfismo de Inclusão entre dois Domínios.
   */
  public extractInclusionMorphism(
    sourceTheoryUri: string,
    targetTheoryUri: string
  ): InclusionMorphismDescriptor {
    const srcDom = this.theoryUriToDomainId.get(sourceTheoryUri);
    const dstDom = this.theoryUriToDomainId.get(targetTheoryUri);

    if (srcDom === undefined || dstDom === undefined) {
      throw new Error(
        `[MMT Morphism Extractor] Domínio origem ou destino não registado.`
      );
    }

    const morphismKey = (srcDom << 16) | dstDom;
    const crossingEdgeIds = this.boundaryCutIndex.get(morphismKey) ?? [];

    const frontierBridges = crossingEdgeIds.map((edgeId) => {
      const edge = this.edges[edgeId];
      return {
        edgeId,
        exportedNode: this.nodes[edge.sourceId],
        mediatingOrTargetNode: this.nodes[edge.targetId],
        epistemicRole: edge.epistemicRole,
      };
    });

    return {
      sourceTheoryUri,
      targetTheoryUri,
      sourceDomainId: srcDom,
      targetDomainId: dstDom,
      frontierBridges,
    };
  }

  /**
   * Constrói o payload de injeção contextual para LLMs respeitando os estratos
   * topológicos do DAG e segregando arestas rebaixadas (ASSOCIATIVE_FEEDBACK).
   */
  public buildLLMContextForNote(
    targetCanonicalUri: string,
    dagProjection: DAGProjectionResult
  ): string {
    const targetId = this.uriToNodeId.get(
      MMTUriResolver.parseCanonical(targetCanonicalUri).canonical
    );
    if (targetId === undefined) {
      throw new Error(`Nota alvo não encontrada: ${targetCanonicalUri}`);
    }

    const visitedStrict = new Uint8Array(this.nodes.length);
    const strictAncestors: EpistemicNodeDescriptor[] = [];
    const associativeLinks: {
      from: EpistemicNodeDescriptor;
      to: EpistemicNodeDescriptor;
    }[] = [];

    // Travessia reversa sobre o subgrafo acíclico estrito
    const stack: number[] = [targetId];
    visitedStrict[targetId] = 1;

    while (stack.length > 0) {
      const curr = stack.pop()!;
      const inE = this.inEdgeIds[curr];

      for (let i = 0; i < inE.length; i++) {
        const edge = this.edges[inE[i]];
        const pred = edge.sourceId;

        if (edge.epistemicRole === EpistemicEdgeRole.STRICT_DEDUCTIVE) {
          if (visitedStrict[pred] === 0) {
            visitedStrict[pred] = 1;
            if (this.nodes[pred].partition === AIFNodePartition.I_NODE) {
              strictAncestors.push(this.nodes[pred]);
            }
            stack.push(pred);
          }
        } else {
          // Aresta rebaixada (Feedback Arc): capturada sem recursão como link associativo
          associativeLinks.push({
            from: this.nodes[pred],
            to: this.nodes[curr],
          });
        }
      }
    }

    // Ordenar ancestrais estritos do estrato mais básico (Nível 0) para o mais derivado
    strictAncestors.sort(
      (a, b) =>
        dagProjection.topologicalLevels[a.internalId] -
        dagProjection.topologicalLevels[b.internalId]
    );

    const lines: string[] = [
      `<contexto_epistemico_modular target="${targetCanonicalUri}">`,
      `  <hierarquia_fundacional_dag>`,
    ];

    for (const anc of strictAncestors) {
      const lvl = dagProjection.topologicalLevels[anc.internalId];
      lines.push(
        `    <conceito nivel_topologico="${lvl}" uri="${anc.uri.canonical}" dominio="${anc.uri.mod}">`,
        `      ${anc.markdownExcerpt}`,
        `    </conceito>`
      );
    }

    lines.push(`  </hierarquia_fundacional_dag>`);

    if (associativeLinks.length > 0) {
      lines.push(`  <referencias_associativas_ciclo_quebrado>`);
      for (const assoc of associativeLinks) {
        lines.push(
          `    <associacao origem="${assoc.from.uri.canonical}" destino="${assoc.to.uri.canonical}" nota="Dependência circular rebaixada em memória para preservar aciclicidade" />`
        );
      }
      lines.push(`  </referencias_associativas_ciclo_quebrado>`);
    }

    lines.push(`</contexto_epistemico_modular>`);
    return lines.join("\n");
  }

  /**
   * Algoritmo de Tarjan O(V + E) retornando apenas os SCCs não-triviais (|C| >= 2).
   */
  private computeNonTrivialSCCs(): number[][] {
    const n = this.nodes.length;
    const dfn = new Int32Array(n).fill(-1);
    const low = new Int32Array(n).fill(-1);
    const onStack = new Uint8Array(n);
    const tarjanStack: number[] = [];
    const nonTrivialSCCs: number[][] = [];
    let timer = 0;

    const dfs = (u: number): void => {
      dfn[u] = low[u] = timer++;
      tarjanStack.push(u);
      onStack[u] = 1;

      const outE = this.outEdgeIds[u];
      for (let i = 0; i < outE.length; i++) {
        const v = this.edges[outE[i]].targetId;
        if (dfn[v] === -1) {
          dfs(v);
          if (low[v] < low[u]) low[u] = low[v];
        } else if (onStack[v] === 1) {
          if (dfn[v] < low[u]) low[u] = dfn[v];
        }
      }

      if (low[u] === dfn[u]) {
        const component: number[] = [];
        while (true) {
          const w = tarjanStack.pop()!;
          onStack[w] = 0;
          component.push(w);
          if (w === u) break;
        }
        // Em grafos bipartidos sem auto-laços, um ciclo requer pelo menos 2 vértices
        if (component.length >= 2) {
          nonTrivialSCCs.push(component);
        }
      }
    };

    for (let u = 0; u < n; u++) {
      if (dfn[u] === -1) {
        dfs(u);
      }
    }

    return nonTrivialSCCs;
  }
}

```

## Síntese Arquitetural e Recomendações de Engenharia

A combinação da representação bipartida AIF com a estrutura modular de grafos de teorias MMT estabelece uma fundação matematicamente sólida para sistemas de conhecimento atómico em escala. Ao isolar os ciclos em componentes fortemente conexos e impor prioridade de partição ( $V_I \succ V_S$ ) nos *buckets* de grau líquido  $\delta(u)$  da heurística de Eades, garante-se que o corte epistémico incida sempre sobre arestas de conclusão ( $S \to I$ ). Esta propriedade preserva a semântica de hiper-arestas inferenciais sob quebra de ciclos, evitando a corrupção silenciosa de definições multi-premissa (*RA-nodes*) e convertendo o esquema inteiro numa associação lateral explícita enquanto mantém intactos os ficheiros Markdown do utilizador em disco.

Adicionalmente, graças ao desaninhamento proporcionado pelo esquema de endereçamento tripartido `doc?mod?sym`, uma edição pontual num ficheiro físico Markdown não exige a reconstrução do grafo global, viabilizando uma reavaliação incremental guiada por cones de dependência MMT. O motor pode consultar em tempo constante  $\mathcal{O}(1)$  o índice `boundaryCutIndex` para identificar apenas o cone de dependência direta de um passo (*one-step forward dependency cone*) dos domínios afetados e reexecutar a projeção acíclica exclusivamente sobre os SCCs intersetados. Por fim, esta arquitetura assegura o alinhamento epistémico na Geração Aumentada por Recuperação (GraphRAG): a separação em memória entre o subgrafo acíclico `STRICT_DEDUCTIVE` — estratificado por níveis topológicos  $\mathcal{L}(v)$  — e o conjunto de retorno `ASSOCIATIVE_FEEDBACK` elimina o fenómeno de colapso de raciocínio em LLMs perante definições mutuamente recursivas, garantindo que axiomas primitivos locais ( $d^-_{\text{intra}} = 0 \land d^-_{\text{inter}} = 0$ ) precedam sempre os conceitos derivados na janela de atenção do modelo.
