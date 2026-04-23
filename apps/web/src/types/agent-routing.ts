export type AgentRoutingConfig = Record<string, string>;

export interface AgentDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface CategoryDefinition {
  key: string;
  name: string;
  description: string;
}

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  {
    key: 'sisyphus',
    name: 'Sisyphus',
    description: 'Coordenador principal — distribui tarefas e mantém o fluxo da sessão',
    icon: '🔄',
  },
  {
    key: 'oracle',
    name: 'Oracle',
    description: 'Consultor de arquitetura — avalia decisões, trade-offs e caminhos',
    icon: '🔮',
  },
  {
    key: 'prometheus',
    name: 'Prometheus',
    description: 'Planejador principal — organiza execução em passos claros',
    icon: '🔥',
  },
  {
    key: 'explore',
    name: 'Explore',
    description: 'Explorador rápido — levanta contexto e pesquisa o código',
    icon: '🔍',
  },
  {
    key: 'multimodal-looker',
    name: 'Multimodal Looker',
    description: 'Leitor visual — inspeciona interfaces e layouts',
    icon: '👁️',
  },
  {
    key: 'metis',
    name: 'Metis',
    description: 'Analista de lacunas — identifica o que falta no plano',
    icon: '🧩',
  },
  {
    key: 'atlas',
    name: 'Atlas',
    description: 'Navegação estratégica — ajuda a escolher a direção',
    icon: '🧭',
  },
  {
    key: 'librarian',
    name: 'Librarian',
    description: 'Bibliotecário — pesquisa referências e documentação',
    icon: '📚',
  },
  {
    key: 'sisyphus-junior',
    name: 'Sisyphus Junior',
    description: 'Júnior de coordenação — tarefas menores e suporte',
    icon: '🤖',
  },
  {
    key: 'momus',
    name: 'Momus',
    description: 'Revisor complementar — checagens finais e validação',
    icon: '✅',
  },
  {
    key: 'hephaestus',
    name: 'Hephaestus',
    description: 'Engenheiro de execução — tarefas auxiliares e automações',
    icon: '🔨',
  },
];

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    key: 'visual-engineering',
    name: 'Visual Engineering',
    description: 'Frontend, UI, layout e decisões visuais',
  },
  {
    key: 'ultrabrain',
    name: 'Ultrabrain',
    description: 'Alto raciocínio e decisões arquiteturais difíceis',
  },
  {
    key: 'deep',
    name: 'Deep',
    description: 'Pesquisa profunda e execução com contexto amplo',
  },
  {
    key: 'artistry',
    name: 'Artistry',
    description: 'Trabalho criativo e conteúdo mais livre',
  },
  {
    key: 'quick',
    name: 'Quick',
    description: 'Mudanças pequenas, rápidas e tarefas curtas',
  },
  {
    key: 'unspecified-low',
    name: 'Unspecified Low',
    description: 'Tarefas leves sem classificação específica',
  },
  {
    key: 'unspecified-high',
    name: 'Unspecified High',
    description: 'Tarefas complexas sem classificação explícita',
  },
  {
    key: 'writing',
    name: 'Writing',
    description: 'Textos, documentação e conteúdo escrito',
  },
];
