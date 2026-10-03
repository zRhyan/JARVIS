# Orientações para agentes

Antes de planejar ou alterar este repositório, leia nesta ordem:

1. [ARQUITETURA.md](ARQUITETURA.md): objetivo do JARVIS, limites entre os pacotes, decisões técnicas e contratos do produto.
2. [PLANO.md](PLANO.md): estado verificado da implementação, pendências, sequência dos marcos e comandos de validação.

Esses dois arquivos são o ponto de entrada do projeto. Consulte as especificações em `docs/` pelos links neles indicados quando precisar de detalhes de um marco.

O produto é o cérebro de conhecimento do JARVIS apoiado em um vault específico, ainda indisponível neste computador. Notas e tags de exemplo não definem o domínio desse vault. Desenvolva com fixtures e reserve a validação das convenções reais e da recuperação de conhecimento para a conexão com o vault de destino.

## Como trabalhar

- Diferencie arquitetura pretendida de comportamento implementado. Verifique o código e os testes antes de declarar uma funcionalidade pronta; o changelog histórico não comprova a conclusão de um marco.
- Preserve a separação entre núcleo, orquestração do agente e interface. Reutilize os contratos existentes antes de criar novas abstrações.
- Respeite as regras de acesso ao cofre e o fluxo de propostas descritos em `ARQUITETURA.md`. A aprovação humana nesse fluxo é uma regra do produto para editar notas do usuário, não uma exigência de aprovação para cada alteração no código deste repositório.
- Execute as verificações pertinentes à alteração e informe falhas ou limitações. Os comandos disponíveis e seus problemas conhecidos estão em `PLANO.md`.
- Ao alterar decisões arquiteturais, atualize `ARQUITETURA.md`. Ao concluir ou descobrir trabalho que mude o estado dos marcos, atualize `PLANO.md` com a evidência correspondente.
- Mantenha a documentação em português e os identificadores de código consistentes com o projeto. Não versione credenciais, dependências instaladas ou artefatos de execução.
