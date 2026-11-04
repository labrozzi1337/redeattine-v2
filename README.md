# Rede Attini — site e blog

Home da Rede Attini (lojista e indústria), blog público e painel do blog.

| Parte | Tecnologia | Pasta |
|---|---|---|
| Front (site, blog e painel) | Vite + React + Three.js + GSAP + Lenis | raiz (`src/`, `admin/`) |
| Back-end (toda a lógica) | Next.js 16 (só rotas `/api`) | `server/` |
| Banco (só dados) | Postgres do Supabase, schema `SYS_SITE_ATTINI` | `server/db/` |
| Imagens do blog | Supabase Storage, bucket `site-attini` | — |

O banco não tem funções, gatilhos nem regras: permissões, revisões, números e validações ficam no back-end.
O navegador nunca fala com o Supabase; tudo passa por `/api` no próprio domínio do site.

| Endereço | O que é |
|---|---|
| `/` | Home |
| `/blog`, `/blog/<endereco>` | Blog público (busca, categorias, comentários) |
| `/2024/03/<endereco>/` | Endereços antigos do WordPress: abrem o mesmo post |
| `/admin/` | Painel do blog (login) |
| `/sitemap.xml` | Mapa do site para o Google (gerado pelo back-end) |

## Rodar na sua máquina

Precisa do Docker aberto (o Supabase local faz o papel do banco e do Storage).

```bash
npx supabase start                 # Postgres e Storage locais (portas 553xx)
cd server
cp .env.example .env.local         # e ajuste para o local (veja abaixo)
npm install
npm run db:migrate                 # cria o schema SYS_SITE_ATTINI e as tabelas
npm run db:seed                    # carrega os 40 posts migrados do WordPress, com imagens e comentários
npm run db:admin -- seu@email.com.br "Seu Nome"   # cria o administrador e mostra o link para criar a senha
npm run dev                        # back-end em http://localhost:3001
cd ..
npm install
npm run dev                        # site em http://localhost:5173 e painel em /admin/
```

`server/.env.local` local: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55322/postgres`,
`SUPABASE_URL=http://127.0.0.1:55321`, `SUPABASE_SECRET_KEY` = a `SERVICE_ROLE_KEY` que o `supabase start` mostra,
`SESSION_SECRET` qualquer texto longo e `SITE_URL=http://localhost:5173`.

## Colocar no ar (Vercel)

1. **Banco**: em `server/.env.local`, coloque a `DATABASE_URL` do projeto (Direct connection ou Session pooler),
   `SUPABASE_URL` e `SUPABASE_SECRET_KEY`. Depois, dentro de `server/`:
   ```bash
   npm run db:migrate     # cria o schema SYS_SITE_ATTINI
   npm run db:seed        # posts, imagens (bucket site-attini) e comentários
   npm run db:admin -- seu@email.com.br "Seu Nome"
   ```
   Sem conexão local? Dá para colar `server/db/001_blog.sql` no SQL Editor do Supabase. O seed e o admin,
   porém, precisam rodar por aqui.
2. **Back-end**: novo projeto na Vercel com *Root Directory* = `server`. Variáveis: as de `server/.env.example`
   (na Vercel, a `DATABASE_URL` do *Transaction pooler*, porta 6543). Nome sugerido: `attini-site-api`.
3. **Front**: outro projeto na Vercel com a raiz do repositório. O `vercel.json` manda `/api` e `/sitemap.xml`
   para `https://attini-site-api.vercel.app`. **Se o projeto do back-end tiver outro endereço, troque nesse arquivo.**
   O front não precisa de variáveis.
4. **Domínio**: `www.redeattini.com.br` no projeto do front. Coloque o mesmo em `SITE_URL` no back-end.
5. **E-mail (opcional)**: com `SMTP_URL`, convites e "esqueci a senha" saem por e-mail. Sem ele, o painel mostra
   o link para o administrador copiar e mandar.
6. **Google**: envie `https://www.redeattini.com.br/sitemap.xml` no Search Console.

## Rotas do back-end

- **Públicas**:
  - `GET /api/posts` (filtros `home`, `stories`, `category`, `q`);
  - `GET /api/posts/:slug`;
  - `GET|POST /api/posts/:slug/comments`;
  - `POST /api/posts/:slug/view`;
  - `GET /api/categories`;
  - `GET /api/sitemap`.
- **Login**: `/api/auth/login`, `logout`, `me`, `forgot` e `password` (criar senha pelo link).
- **Painel** (`/api/admin/...`):
  - `posts`, com revisões e duplicar;
  - `media`, `categories`, `comments`, `users`, com convite e link de nova senha;
  - `me`, `stats` e `counts`.

Segurança:

- **Senhas:** guardadas com scrypt.
- **Sessão:** cookie assinado, `HttpOnly`, `SameSite=Lax`, restrito a `/api`.
- **Tentativas de login:** 5 erros bloqueiam a conta por 15 minutos.
- **Origem dos pedidos:** alterações vindas de outros sites são recusadas.
- **Permissões:** o papel é conferido no banco a cada pedido.

## O painel do blog

Papéis:

- **Administrador**: tudo, inclusive convidar e remover pessoas.
- **Editor**: publica, edita qualquer post, decide onde ele aparece, modera comentários e mantém categorias.
- **Autor**: escreve os próprios posts e envia para revisão. Não publica.

Telas: Painel (visualizações, visitantes, posts mais lidos, de onde vêm os leitores, celular x computador),
Posts (busca, filtros, duplicar, excluir, liga/desliga da home direto na lista), Escrever post, Mídia,
Comentários, Categorias, Usuários (convite por link) e Meu perfil.

No editor, à direita:

- **Publicação**: data de publicação; uma data futura agenda o post, que entra no ar sozinho.
- **Onde exibir**:
  - *Home: seção Blog*: entra entre os 5 mais recentes da home.
  - *Home: Histórias da rede*: vira card de história; a 1ª tag vira a etiqueta.
  - *Destaque*: aparece primeiro e grande nas seções acima.
- **Capa, resumo, categoria, tags, endereço e Google** (com prévia de como aparece na busca).
- **Revisões**: as últimas 30 versões de cada post, com "Restaurar".

## Posts do WordPress

- `server/seed/blog.json` + `server/seed/media/`: retrato dos 40 posts migrados (texto, capas, imagens,
  categorias, histórias e comentários). É de onde o `db:seed` carrega, sem depender do WordPress.
- `npm run wp:import` (em `server/`): traz posts **novos** do WordPress enquanto ele estiver no ar. Não mexe nos
  que já existem (`--atualizar` força sobrescrever; `--dry` só mostra).

## Leads

Sem configuração, os formulários abrem o WhatsApp da Attini com a mensagem pronta.
Para gravar os leads em um sistema, defina no build `VITE_LEAD_ENDPOINT=https://seu-endpoint/leads`.

## Onde editar

- `src/data.js`: números, lojas, cotas para a indústria, benefícios do lojista, marcas.
- `src/stores.json`: as 197 lojas do mapa (estado, cidade, nome, endereço), do mapa do site oficial em nov/2026.
- `src/geo.json`: estados e as 148 cidades (coordenadas reais).
- `src/Layout.jsx`: cabeçalho, rodapé e contatos (iguais na home e no blog).
- `server/lib/blog.js`: regras dos posts (permissões, revisões, números).
- `public/brands/`, `public/img/`, `public/flags/`: imagens do site.

## Limites conhecidos

- **Prévia ao compartilhar um post** (WhatsApp, LinkedIn) mostra título e imagem gerais da Rede Attini.
  Agora que existe back-end na Vercel, dá para gerar a prévia de cada post.
- Spam nos comentários: há campo-isca e limite por e-mail; se passar disso, entra um captcha.

## Antes de publicar

- O mapa oficial tem 197 lojas e nenhuma no DF; o site diz 220 lojas e inclui o DF. Atualizar `src/stores.json` ou o número.
- Confirmar 220 lojas, R$ 780 mi (12 meses) e "80+ indústrias" em `src/data.js`.
- Confirmar que a 4ª edição do Conexão Attini já aconteceu (o texto diz "já está na 4ª edição").
- Validar o escopo das cotas em `TRADE` com o comercial.
- Revisar as categorias que a migração criou (Eventos, Rede Attini, Gestão da loja, Mercado).
