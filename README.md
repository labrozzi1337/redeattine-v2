# Rede Attini — site e blog

Home da Rede Attini (lojista e indústria), blog público e painel do blog.

| Parte | Tecnologia | Pasta |
|---|---|---|
| Front (site, blog e painel) | Vite + React + Three.js + GSAP + Lenis | raiz (`src/`, `admin/`) |
| Back-end (toda a lógica) | Next.js 16 (só rotas `/api`) | `server/` |
| Banco (só dados) | Postgres do Supabase, schema `SYS_SITE_ATTINI`, acessado pela API com a chave secreta | `server/db/` |
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

## Colocar para funcionar

O back-end fala com o banco **pela API do Supabase com a chave secreta**. Não usa a senha do banco.
Variáveis já preenchidas em `server/.env.local` (fora do git): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SESSION_SECRET`, `SITE_URL`.

1. **Migrations**: no SQL Editor do Supabase, rode em ordem (podem ser rodadas de novo sem problema):
   - `server/db/001_blog.sql`: schema `SYS_SITE_ATTINI` e tabelas;
   - `server/db/002_admin_inicial.sql`: administrador `elvis@labrozzi.com.br` (senha provisória);
   - `server/db/003_acesso_api.sql`: acesso do back-end ao schema. O público continua sem acesso.
   - `server/db/004_posts_wordpress.sql`: os 40 posts que vieram do WordPress (texto, capa, imagens, SEO, categorias,
     Histórias da rede e comentários). As imagens já estão no Storage.
2. **Expor o schema**: *Project Settings > Data API > Exposed schemas*: adicione `SYS_SITE_ATTINI` e salve.
3. **Alternativa à 004**: dentro de `server/`, `npm run db:seed` carrega os mesmos posts pela API (pode repetir).
4. **Rodar**: na raiz, `npm run dev` sobe o site (http://localhost:5173, painel em /admin) e o back-end (porta 3001).
   Entre com `elvis@labrozzi.com.br` e a senha provisória: o painel obriga a criar uma senha nova.

Se algo faltar, o painel diz exatamente o quê (schema não exposto, migration faltando, chave inválida).

## Colocar no ar (Vercel)

1. **Um projeto só** (Vercel Services): o `vercel.json` define o serviço `app` (Vite, raiz) e o `server`
   (Next.js, pasta `server`). `/api/*` e `/sitemap.xml` vão para o `server`, o resto para o `app`.
   Em *Settings → Build and Deployment*, o *Framework Preset* do projeto deve ser **Services**.
2. **Variáveis do projeto**: as de `server/.env.local`. Em `ALLOWED_ORIGINS`, coloque os endereços extras
   pelos quais o painel será aberto (ex.: o `.vercel.app` do projeto), separados por vírgula.
3. **Domínio**: `www.redeattini.com.br` no projeto (igual ao `SITE_URL`).
4. **E-mail (opcional)**: com `SMTP_URL`, convites e "esqueci a senha" saem por e-mail. Sem ele, o painel mostra
   o link para o administrador copiar e mandar.
5. **Google**: envie `https://www.redeattini.com.br/sitemap.xml` no Search Console.

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
- **Senha provisória:** a senha inicial só serve para criar a senha definitiva.
- **Chaves:** a chave secreta do Supabase fica só no back-end (`server/.env.local` e Vercel), nunca no front.

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
- Confirmar 220 lojas e "80+ indústrias" em `src/data.js`. R$ 780 mi (12 meses) está fora do ar até o Eliseu confirmar (linha comentada em `STATS`).
- Confirmar que a 4ª edição do Conexão Attini já aconteceu (o texto diz "já está na 4ª edição").
- Validar o escopo das cotas em `TRADE` com o comercial.
- Revisar as categorias que a migração criou (Eventos, Rede Attini, Gestão da loja, Mercado).
