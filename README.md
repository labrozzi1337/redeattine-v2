# Rede Attini — site

Home da Rede Attini para os dois públicos (lojista e indústria). Vite + React + Three.js + GSAP + Lenis.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático)
node cnpj.check.mjs
```

O `dist/` é estático: sobe em qualquer hospedagem (Vercel, Netlify, Cloudflare Pages, Apache/Nginx).

## Versões

- **v1**: tag `v1` (`git checkout v1`). Primeira versão apresentada.
- **v2**: branch `v2`. Ajustes a partir dos apontamentos de nov/2026:
  - lojista vira o público padrão; cada público vê só o seu conteúdo (cotas e trilha da indústria
    não aparecem para o lojista, e o Conexão Attini fala com cada um do seu jeito);
  - faixa de impacto: R$ 780 mi em compras (12 meses, toda a rede), 220 lojas, 148 cidades, 9 estados + DF;
  - "colônia" só na origem do nome; no resto do site, "rede";
  - mapa sem tour preso ao scroll: abre com a rede inteira e o visitante escolhe o estado;
  - seção "Histórias da rede" com casos reais do blog;
  - logos das indústrias servidos do próprio site, sem cortes.

## Leads

Sem configuração, os formulários abrem o WhatsApp da Attini com a mensagem pronta.
Para gravar os leads em um sistema, defina no build:

```bash
VITE_LEAD_ENDPOINT=https://seu-endpoint/leads npm run build
```

O formulário faz `POST` JSON nesse endereço e só cai no WhatsApp se o envio falhar.

## Onde editar

- `src/data.js`: números, lojas, cotas para a indústria, benefícios do lojista, histórias, marcas.
- `src/data.js` → `STORIES`: para incluir um depoimento, adicione `{ tag, quote, who, img }`.
- `src/geo.json`: estados e as 148 cidades (coordenadas reais).
- `public/brands/`: logos das indústrias (originais do site atual, recortados e padronizados).
- `public/img/historias/`: imagens das histórias (do blog atual).
- `public/flags/`: bandeiras dos estados e do DF (Wikimedia Commons, domínio público).
- `public/img/ai/`: imagens geradas por IA (GPT Image), ilustrativas.
- O blog lê os posts ao vivo da API do WordPress (`src/Blog.jsx`).

## Antes de publicar

- Confirmar 220 lojas, R$ 780 mi (12 meses) e "80+ indústrias" em `src/data.js`.
- Confirmar a cidade do DF (entrou como Brasília em `src/geo.json`).
- Confirmar que a 4ª edição do Conexão Attini já aconteceu (o texto diz "já está na 4ª edição").
- Validar o escopo das cotas em `TRADE` com o comercial.
- Trocar ou complementar as histórias com depoimentos aprovados pelos lojistas.
