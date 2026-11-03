import geo from './geo.json'

export const PHONE = '(63) 3142.2061'
export const WHATS = '556331422061'
export const SOCIAL = {
  instagram: 'https://www.instagram.com/redeattini/',
  facebook: 'https://www.facebook.com/redeattini',
  linkedin: 'https://br.linkedin.com/company/redeattini',
}

// Ordem do tour no mapa: maior presença primeiro.
export const STATE_NAMES = { GO: 'Goiás', TO: 'Tocantins', PB: 'Paraíba', RN: 'Rio Grande do Norte', MG: 'Minas Gerais', PA: 'Pará', BA: 'Bahia', MA: 'Maranhão', MT: 'Mato Grosso' }
export const REGIONS = Object.keys(STATE_NAMES).map(uf => {
  const cities = geo.cities.filter(c => c.uf === uf)
  return { uf, name: STATE_NAMES[uf], cities }
})
export const TOTAL_CITIES = geo.cities.length

// Números da faixa de prova. Cidades e estados vêm do mapa do site atual (nov/2026).
// CONFIRMAR antes de publicar: volume de compras e nº de marcas.
export const STATS = [
  { value: REGIONS.length, label: 'estados', note: 'de Minas ao Rio Grande do Norte' },
  { value: TOTAL_CITIES, label: 'cidades com loja Attini', note: 'a maioria no interior' },
  { value: 332, prefix: 'R$ ', suffix: ' mi', label: 'comprados por ano', note: 'só pelas lojas de Goiás' },
  { value: 80, suffix: '+', label: 'indústrias parceiras', note: 'nacionais e regionais' },
]

const L = 'https://www.redeattini.com.br/wp-content/uploads/elementor/thumbs/'
// ponytail: logos via hotlink do site atual; copiar para /public antes de ir ao ar.
export const BRANDS = [
  ['Amanco Wavin', 'amanco-wavin-ql9accy6mnv0aefmipgrqqi7wexf7obdf7lirx0848.png'],
  ['Tramontina', 'tramontina-ql9axgfs0sqovbsfbtrbpeunvqxzz42hnmpujhq4iw.png'],
  ['Gerdau', 'Gerdau-ql9aqpxf1jipnxkonwxku41qmc5at7bqqaekq3pp8e.png'],
  ['Eternit', 'eternit-q8xsj7fd307y9qp4oktxcqa77qxcfgm9c1711cyjms.jpg'],
  ['Lorenzetti', 'lorenzetti-logo-scaled-q8xsj1sby008c2xblie5xrpfnfp559zvb9a45p6wiu.jpg'],
  ['Docol', 'docol_logo1-qtywjo0bqrl0iz1jpsii369ko7vvuvy9elngpdj666.png'],
  ['Quartzolit', 'quartzolit-1-ql9beeh189xs696bdng75mwtetf7qocabi3z02lmgk.jpeg'],
  ['Roca', 'roca-1-ql9benvf4manecsnurigukjfco4vvndlosmtsu7oxk.png'],
  ['Fortlev', 'fortlev-q8xsiw5aszsief5iifyeit4o34gxv3dhahd7a1f9my.png'],
  ['Coral', 'coral-logo-2-rps2b9y2iqe91wvuv46sbqotvzt0choo08v9n6qdh2.png'],
  ['Starrett', 'starrett-logo-rps1i7rp84m43x3hk1z0qkosq51hddbf0erui7tki0.jpg'],
  ['Elgin', 'elgin-ql9aq82hfou9jcamk77o0qjzc0lbqycubu0clug6p0.png'],
  ['Astra', 'astra-1-ql9ansnhs3iljltlqnfd2um436k6v3psztc6z41spg.jpg'],
  ['Atlas', 'NOVA-LOGO-ATLAS-OFICIAL_230809_142134-rps23abgffgid8hninuy4r9s436ox3yswp8osikum8.jpg'],
  ['Onduline', 'Onduline-Logo-1-1134-rps12qdendf2v5l4yv195zcggnctkuul7rwwx4rzuy.jpg'],
  ['Cortag', 'cortag-ql9apq7jtu5ter0kghhr7d281p1copdxxdm4hl6nty.png'],
  ['Delta', 'logo-Delta-porcelanato-q8xsj5jopc5dmiruzk0o7qra0z6m02esnrw22t1c5c.jpg'],
  ['Eucatex', 'eucatex-tintas-logo-rps2lo1u2smdepsg6lwaw4aabcl3g0xu3oiinbbpc8.png'],
  ['Iquine', 'iquine-seeklogo-rps2pbn8nlmik4hau6s2l72thakhdng99ruhu1wkhs.png'],
  ['Condor', 'condor-logo-png_seeklogo-326412-rps2ajml7de80ty34st8dxbx97eqcys6kmlo7fteyw.png'],
  ['Alfagres', 'alfagres-logo-png_seeklogo-252961-rps1s7rvxoaxmkkk5vl4rjuc8pr29g0m1wmtb6zsaw.png'],
  ['Luztol', 'Luztol-2-rps2t9kvbl0t98r4te4qjp9f6h4wny3q5actau249s.png'],
  ['Fame', 'fame-logo-8-rps2lwidsaxyb7g5t7jy0k5fntfedavf4udvysz51k.png'],
  ['Incopisos', 'Incopisos-ql9ardfdseevq6mjup392g49gyxh5mx15ippq0quvg.png'],
  ['Precon', 'precon_-qtywv8etudf1e88p6ai89r6rtwvhksvcnunkaydrse.png'],
  ['Cerbras', 'cerbras-qtyw03z7jut8z1g6wu6xplxbqm9yplbb1t0s94j1py.png'],
  ['Wesco', 'nova-logo-wesco-qtywtk95oz4or6o2xki3u6d9t93zw68j3kwhl8uyqq.png'],
  ['Ramassol', 'grupo-ramassol-ql9ar335p80q6h1kj2mct0q6xqcfsyrzg3jdfz66ww.png'],
  ['Solomassa', 'LOGO_SOLOMASSA_SITE-rps3hv0u5iox1x0z70vashtmrfwo2tqvj0w7dhl9de.png'],
  ['Zagonel', 'ZAGONEL-rps3m56dacjxxyt26vi45ex86msv56qus7vu2v8owi.png'],
  ['Vitrofort', 'vitrofort-qlen1vhibmsnxjb1azic7ktt6istdorowpzevkomwm.jpg'],
  ['Supermax', 'TINTASSUPERMAX-rps3ifpabvh85c6xu9t3bclrtx2qs60yxv8vxkqlyo.png'],
].map(([name, file]) => ({ name, src: L + file }))

export const INDUSTRY = [
  {
    n: '01', img: '/img/ai/caminhao.webp', t: 'Uma negociação.\nCentenas de pedidos.',
    d: 'Sua tabela é negociada uma vez com a rede e chega pronta a cada loja associada. Menos visita, menos custo comercial por ponto de venda, mais giro.',
  },
  {
    n: '02', img: '/img/ai/fachada.webp', t: 'O interior que o seu\nrepresentante não alcança.',
    d: `${TOTAL_CITIES} cidades, a maioria fora das capitais. Lojas onde quem decide a compra é o dono do balcão, e quem indica a marca é o balconista.`,
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

export const RETAIL = [
  ['Compra', ['Negociação direta com a indústria', 'Tabelas de preço exclusivas', 'Sistema de gestão de compras com suporte']],
  ['Gestão', ['Encontros de análise de indicadores', 'Assessoria contábil e financeira', 'Médias de mercado para comparar sua loja']],
  ['Marketing', ['Campanhas de venda com conteúdo pronto', 'Suporte de marketing digital', 'Festival de Prêmios para o seu cliente']],
  ['Comunidade', ['Troca diária com lojistas da rede', 'Treinamentos e reuniões mensais', 'Lojista Protagonista e Conexão Attini']],
]
