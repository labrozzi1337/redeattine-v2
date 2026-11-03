# Rede Attini — site

Home da Rede Attini para os dois públicos (indústria e lojista). Vite + React + Three.js + GSAP + Lenis.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático)
node cnpj.check.mjs
```

O `dist/` é estático: sobe em qualquer hospedagem (Vercel, Netlify, Cloudflare Pages, Apache/Nginx).

## Leads

Sem configuração, os formulários abrem o WhatsApp da Attini com a mensagem pronta.
Para gravar os leads em um sistema, defina no build:

```bash
VITE_LEAD_ENDPOINT=https://seu-endpoint/leads npm run build
```

O formulário faz `POST` JSON nesse endereço e só cai no WhatsApp se o envio falhar.

## Onde editar

- `src/data.js` — números, cotas para a indústria, benefícios do lojista, marcas.
- `src/geo.json` — estados e as 147 cidades (coordenadas reais).
- `public/flags/` — bandeiras dos estados (Wikimedia Commons, domínio público).
- `public/img/ai/` — imagens geradas por IA (GPT Image), ilustrativas.
- O blog lê os posts ao vivo da API do WordPress (`src/Blog.jsx`).

## Antes de publicar

- Confirmar R$ 332 mi/ano e "80+ indústrias" em `src/data.js`.
- Validar o escopo das cotas em `TRADE` com o comercial.
- Os logos das marcas ainda são carregados do site atual (hotlink).
