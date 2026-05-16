## `@apps/web` — Requisitos Refinados

### 1. Requisitos Globais

- [ ] O filtro principal do header deve ser controlado por contexto global (ex.: React Context ou store compartilhada).
- [ ] O valor do filtro deve ser persistido entre páginas durante a navegação (sem reset ao trocar de rota).
- [ ] Implementar o modo de filtro “Personalizado” já presente na UI, incluindo comportamento e integração com dados.
- [ ] Refatorar o menu lateral para usar o componente Sidebar do shadcn/ui.

---

### 2. Página `/model-stats`

#### 2.1 Header

- [ ] Remover o seletor de colunas da lateral do header da página.
- [ ] Migrar a ação “Merge Models” (UI + lógica) de `/model-stats` para o header do card “Configured Models” em `/models`.

#### 2.2 Cards de métricas (topo)

- [x] Total Spend: manter sem alterações.
- [ ] Total Tokens: alterar subtítulo de `n requests` para `n input tokens`.
- [x] Requests: manter sem alterações.
- [ ] Success Rate: remover card.
- [ ] Average Latency: renomear métrica principal para `Avg Tokens/s`.
- [ ] Average Latency: exibir `avg latency` no subtítulo.
- [ ] Models: remover card.
- [ ] Adicionar card “Efficiency Score” com média de `$/1K tokens`.
- [ ] No subtítulo de “Efficiency Score”, destacar o modelo mais eficiente (menor custo por 1K tokens).
- [ ] No subtítulo de “Efficiency Score”, destacar o modelo menos eficiente (maior custo por 1K tokens).

---

### 3. Logs — Request Chat Viewer

#### 3.1 Mudança estrutural da experiência

- [ ] Substituir a visualização atual em modal/dialog por uma página de detalhes da requisição.
- [ ] A nova página deve consolidar metadados relevantes da request de forma clara, escaneável e orientada à análise.

#### 3.2 Aba “Chat Details”

- [ ] Criar aba dedicada para detalhes de conversação (mensagens, tools e contexto relacionado).
- [ ] Implementar visualização em formato de chat estático.
- [ ] Exibir mensagens por papel (`user`, `assistant`, `system`, `tool`).
- [ ] Exibir tools acionadas.
- [ ] Exibir resultados das tools quando disponível.

#### 3.3 Aba “Metrics & Cost”

- [ ] Criar aba dedicada para custo, latência e tokens.
- [ ] Incluir gráfico de barras para distribuição de tokens (`input` vs `output`).
- [ ] Incluir gráfico de linha para evolução de custo no tempo (quando aplicável).
- [ ] Incluir tabela-resumo com as principais métricas da requisição.

---

### 4. Agents

#### 4.1 Aba Agents

- [ ] Substituir a edição atual em dialog por uma página dedicada de configuração do agente, acessível via botão “Edit” no card do agente.
- [ ] Implementar botão para adição de novos agentes.
- [ ] Implementar confirmação de exclusão com Alert Dialog do shadcn/ui.
- [ ] Adicionar seletor rápido de modelo primário no agente.
- [ ] Adicionar seção/aba para seleção de modelo primário e modelo fallback.
- [ ] Mapear opções adicionais disponíveis por agente (ex.: tools, skills) e implementar edição dessas opções.

#### 4.2 Aba Categories

- [ ] Implementar criação, edição e exclusão de categorias com todos os parâmetros suportados.

---

### 5. Página `/models`

- [ ] Substituir a edição atual em dialog por uma página dedicada de configuração do modelo, acessível via botão “Edit” no card do modelo.
- [ ] Refatorar a edição considerando claramente os campos globais e os campos específicos do modelo.
