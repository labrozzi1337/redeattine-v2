import geo from './geo.json'

export const PHONE = '(63) 3142.2061'
export const WHATS = '556331422061'
export const SOCIAL = {
  instagram: 'https://www.instagram.com/redeattini/',
  facebook: 'https://www.facebook.com/redeattini',
  linkedin: 'https://br.linkedin.com/company/redeattini',
}

// Ordem do tour no mapa: maior presença primeiro.
export const STATE_NAMES = { GO: 'Goiás', TO: 'Tocantins', PB: 'Paraíba', RN: 'Rio Grande do Norte', MG: 'Minas Gerais', PA: 'Pará', BA: 'Bahia', MA: 'Maranhão', MT: 'Mato Grosso', DF: 'Distrito Federal' }
export const REGIONS = Object.keys(STATE_NAMES).map(uf => {
  const cities = geo.cities.filter(c => c.uf === uf)
  return { uf, name: STATE_NAMES[uf], cities }
})
export const TOTAL_CITIES = geo.cities.length
export const N_STATES = REGIONS.filter(r => r.uf !== 'DF').length
export const AREA = `${N_STATES} estados e o Distrito Federal`
// CONFIRMAR antes de publicar: dados enviados pela Attini (nov/2026).
export const STORES = 220

// Faixa de impacto. Lojas e volume informados pela Attini (nov/2026); cidades vêm do mapa.
// CONFIRMAR antes de publicar: nº de indústrias parceiras.
export const STATS = [
  { value: 780, prefix: 'R$ ', suffix: ' mi', label: 'em compras', note: 'nos últimos 12 meses, toda a rede', big: true },
  { value: STORES, label: 'lojas associadas', note: 'com o nome e o jeito de cada dono' },
  { value: TOTAL_CITIES, label: 'cidades', note: 'a maioria no interior' },
  { value: N_STATES, suffix: ' + DF', label: 'estados e o Distrito Federal', note: 'de Minas ao Rio Grande do Norte' },
  { value: 80, suffix: '+', label: 'indústrias parceiras', note: 'nacionais e regionais' },
]

// Logos originais do site atual, recortados e padronizados em /public/brands.
export const BRANDS = [
  'Amanco Wavin', 'Tramontina', 'Gerdau', 'Eternit', 'Lorenzetti', 'Docol', 'Quartzolit', 'Roca', 'Fortlev', 'Coral', 'Starrett', 'Elgin', 'Astra', 'Atlas', 'Onduline', 'Cortag', 'Delta', 'Eucatex', 'Iquine', 'Condor', 'Alfagres', 'Luztol', 'Fame', 'Incopisos', 'Precon', 'Cerbras', 'Wesco', 'Ramassol', 'Solomassa', 'Zagonel', 'VM', 'Supermax',
].map(name => ({ name, src: `/brands/${name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}.webp` }))

export const INDUSTRY = [
  {
    n: '01', img: '/img/ai/caminhao.webp', t: 'Uma negociação.\nCentenas de pedidos.',
    d: 'Sua tabela é negociada uma vez com a rede e chega pronta a cada loja associada. Menos visita, menos custo comercial por ponto de venda, mais giro.',
  },
  {
    n: '02', img: '/img/ai/fachada.webp', t: 'O interior que o seu\nrepresentante não alcança.',
    d: `${STORES} lojas em ${TOTAL_CITIES} cidades, a maioria fora das capitais. Lojas onde quem decide a compra é o dono do balcão, e quem indica a marca é o balconista.`,
  },
  {
    n: '03', img: '/img/ai/gondola.webp', t: 'Trade marketing\ncom execução garantida.',
    d: 'Campanhas institucionais, conteúdo digital e o Festival de Prêmios para o consumidor final. A rede executa em todas as lojas; sua marca aparece em todas.',
  },
  {
    n: '04', img: '/img/conexao.webp', t: 'Conexão Attini:\no pedido sai na hora.',
    d: 'A rodada de negócios que movimenta milhões em poucas horas. Lojistas com poder de decisão, frente a frente com a sua equipe comercial.',
  },
]

// Catálogo de oportunidades para a indústria. VALIDAR escopo de cada cota com o comercial antes de publicar.
// Imagens em /img/ai são geradas por IA (ilustrativas); as demais vêm do site atual.
export const TRADE = [
  {
    t: 'Compra conjunta', tag: 'Volume', img: '/img/ai/caminhao.webp',
    d: 'Sua tabela negociada uma única vez com a Attini e entregue pronta a todas as lojas associadas. O pedido sai consolidado, com volume de rede.',
    inclui: ['Tabela exclusiva divulgada para toda a rede', 'Pedidos consolidados por campanha ou período', 'Time de compras da Attini acompanhando a negociação', 'Acesso a lojas onde sua equipe de campo não chega'],
    formato: 'Negociação anual ou por campanha', ideal: 'Ganhar cobertura e volume sem aumentar a equipe de vendas',
  },
  {
    t: 'Cota Conexão Attini', tag: 'Evento', img: '/img/conexao.webp',
    d: 'Sua equipe comercial frente a frente com os donos das lojas, no evento que movimenta milhões em pedidos em poucas horas.',
    inclui: ['Estande no evento', 'Rodada de negócios com lojistas que decidem a compra', 'Marca nas peças de divulgação da edição', 'Condição especial de pedido no dia'],
    formato: 'Cotas por edição', ideal: 'Bater meta de curto prazo e apresentar lançamentos',
  },
  {
    t: 'Campanha institucional', tag: 'Sell-out', img: '/img/ai/gondola.webp',
    d: 'Uma campanha de vendas com a sua marca rodando em todas as lojas ao mesmo tempo, com mecânica, peças e comunicação feitas pela rede.',
    inclui: ['Mecânica de vendas desenhada com a sua marca', 'Peças digitais prontas para todas as lojas', 'Material de ponto de venda', 'Divulgação nos canais da Attini'],
    formato: 'Mensal ou sazonal', ideal: 'Girar uma linha ou categoria na rede inteira',
  },
  {
    t: 'Festival de Prêmios', tag: 'Consumidor final', img: '/img/ai/festival.webp',
    d: 'O sorteio da rede que leva o consumidor final para dentro da loja. Sua marca vira o motivo da compra.',
    inclui: ['Marca como patrocinadora do festival', 'Produto da marca como prêmio ou cupom', 'Presença nos materiais das lojas e nas redes sociais', 'Fluxo para quem compra a sua marca'],
    formato: 'Por edição do festival', ideal: 'Falar direto com quem constrói e reforma',
  },
  {
    t: 'Treinamento de balcão', tag: 'Capacitação', img: '/img/ai/balcao.webp',
    d: 'No varejo de construção, quem indica a marca é o balconista. Leve o seu produto para dentro da cabeça de quem atende o cliente.',
    inclui: ['Capacitação técnica para vendedores e balconistas', 'Espaço nas reuniões mensais da rede', 'Material de apoio para consulta na loja', 'Formato online ou presencial, por região'],
    formato: 'Por ciclo de reuniões', ideal: 'Produtos técnicos em que a indicação decide a venda',
  },
  {
    t: 'Lançamento na rede', tag: 'Lançamento', img: '/img/ai/lancamento.webp',
    d: 'Coloque um produto novo em dezenas de lojas na mesma semana, com apresentação aos donos e condição de primeira compra.',
    inclui: ['Apresentação do lançamento aos lojistas associados', 'Condição de primeira compra conjunta', 'Demonstração ou amostras nas reuniões', 'Comunicado nos canais exclusivos dos lojistas'],
    formato: 'Sob demanda', ideal: 'Acelerar a distribuição numérica de um lançamento',
  },
  {
    t: 'Conteúdo digital', tag: 'Digital', img: '/img/ai/digital.webp',
    d: 'Sua marca no conteúdo que a rede produz e que as lojas publicam para o cliente da cidade delas.',
    inclui: ['Posts e vídeos nos canais da Attini', 'Kit de conteúdo para as lojas publicarem', 'Lives técnicas com especialistas da marca', 'Presença no blog da rede'],
    formato: 'Pacotes mensais', ideal: 'Alcance local com cara de loja do bairro',
  },
  {
    t: 'Lojista Protagonista', tag: 'Relacionamento', img: '/img/protagonista.webp',
    d: 'Patrocine o programa que reconhece e premia os lojistas mais engajados da rede e associe sua marca aos melhores.',
    inclui: ['Premiação patrocinada no programa', 'Critérios ligados ao mix da sua marca', 'Entrega do prêmio em evento da rede', 'Marca ao lado dos lojistas de destaque'],
    formato: 'Por ciclo do programa', ideal: 'Fidelizar o lojista e ampliar o mix na loja',
  },
  {
    t: 'Ponto de venda', tag: 'Merchandising', img: '/img/ai/loja.webp',
    d: 'Exposição padronizada da sua marca nas lojas associadas, negociada uma vez e executada na rede.',
    inclui: ['Expositores e pontas de gôndola', 'Padrão de exposição em toda a rede', 'Implantação acompanhada pela Attini', 'Reposição alinhada às compras conjuntas'],
    formato: 'Contrato por período', ideal: 'Ganhar visibilidade na hora da decisão de compra',
  },
]

// Para o lojista: o que a loja ganha comprando em rede (trilha horizontal)
export const RETAIL = [
  { n: '01', img: '/img/ai/caminhao.webp', t: 'Compra direta\ncom a indústria.', items: ['Negociação direta com mais de 80 indústrias', 'Tabelas de preço exclusivas da rede', 'Sistema de gestão de compras com suporte'] },
  { n: '02', img: '/img/ai/balcao.webp', t: 'Gestão de quem\nentende do balcão.', items: ['Encontros de análise de indicadores', 'Assessoria contábil e financeira', 'Médias de mercado para comparar sua loja'] },
  { n: '03', img: '/img/ai/festival.webp', t: 'Marketing pronto\npara a sua cidade.', items: ['Campanhas de venda com conteúdo pronto', 'Suporte de marketing digital', 'Festival de Prêmios para o seu cliente'] },
  { n: '04', img: '/img/historias/minas.webp', t: 'Lojistas do\nseu lado.', items: ['Troca diária com lojistas da rede', 'Treinamentos e reuniões mensais', 'Lojista Protagonista e Conexão Attini'] },
]

export const JOIN = [
  ['Conte sobre a sua loja', 'Um cadastro de dois minutos, com CNPJ, cidade e faturamento aproximado.'],
  ['Converse com um consultor', 'Ele liga para entender a sua loja e mostra o que muda comprando em rede.'],
  ['Comece a comprar em rede', `Tabelas da rede, gestão, marketing e lojistas de ${AREA} do seu lado.`],
]

// Histórias reais publicadas no blog. Para um depoimento, adicione quote e who:
// { tag: 'Depoimento', quote: 'Texto aprovado pelo lojista', who: 'Nome · Loja (UF)', img: '/img/historias/foto.webp' }
const B = 'https://www.redeattini.com.br/'
export const STORIES = [
  {
    tag: 'Conexão Attini', img: '/img/historias/conexao-4.webp', link: B + '2025/06/conexao-attini-a-1a-edicao-de-um-evento-que-promete-redefinir-o-setor-de-matcon/',
    t: 'R$ 12 milhões em negócios em um único dia',
    d: 'Na 1ª edição, 60 lojas associadas e mais de 200 participantes negociaram frente a frente com as indústrias. O evento já está na 4ª edição.',
  },
  {
    tag: 'Lojistas na mídia', img: '/img/historias/anamaco.webp', link: B + '2026/08/lojistas-attini-ganham-pagina-na-revista-anamaco-e-comprovam-a-forca-da-rede/',
    t: 'Lojistas Attini na Revista ANAMACO',
    d: 'Flávio Nóbrega (Casa Seridó, PB), Dante Aligieri e Henrique Lima (Casa Center, PB) e Renata Rezende (Construtora Rezende, GO) mostraram como tecnologia e atendimento fecham a venda no pequeno varejo.',
  },
  {
    tag: 'Festival de Prêmios', img: '/img/historias/festival.webp', link: B + '2024/11/festival-de-premios-da-rede-attini-fortalecendo-conexoes-premiando-resultados/',
    t: 'O cliente da loja concorrendo a moto, TV e iPhone',
    d: 'Com Atlas e Luztol, cada compra a partir de R$ 200 em uma loja da rede virou um bilhete da sorte para o consumidor final.',
  },
  {
    tag: 'Expansão', img: '/img/historias/minas.webp', link: B + '2025/08/attini-acelera-expansao-e-chega-a-minas-gerais-abrindo-novas-oportunidades-para-lojistas-do-sudeste/',
    t: 'A rede chegou a Minas Gerais',
    d: 'A reunião com lojistas mineiros abriu o caminho da Attini no Sudeste.',
  },
  {
    tag: 'Embaixador', img: '/img/historias/vampeta.webp', link: B + '2024/03/vampeta-pentacampeao-do-mundo-pela-selecao-brasileira-e-o-embaixador-da-rede-attini/',
    t: 'Vampeta veste a camisa da Attini',
    d: 'O pentacampeão do mundo pela Seleção é o embaixador da rede.',
  },
]
