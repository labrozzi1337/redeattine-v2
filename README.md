# Rede Attini — site e blog

Home da Rede Attini (lojista e indústria), blog público e painel do blog.
Vite + React + Three.js + GSAP + Lenis no site; Supabase (banco, login, imagens) no blog.

| Endereço | O que é |
|---|---|
| `/` | Home |
| `/blog`, `/blog/<endereco>` | Blog público (busca, categorias, comentários) |
| `/2024/03/<endereco>/` | Endereços antigos do WordPress: abrem o mesmo post |
| `/admin/` | Painel do blog (login) |

```bash
npm install
npm run dev      # http://localhost:5173  e  http://localhost:5173/admin/
npm run build    # gera dist/ (site estático)
node cnpj.check.mjs
```

## Versões

- **v1**: tag `v1` (`git checkout v1`). Primeira versão apresentada.
- **v2**: apontamentos de nov/2026 (lojista como padrão, faixa de impacto, mapa direto, Histórias da rede, logos).
- **Blog próprio**: substitui o WordPress (este documento).

## O painel do blog

Papéis:

- **Administrador**: tudo, inclusive convidar e remover pessoas.
- **Editor**: publica, edita qualquer post, decide onde ele aparece, modera comentários e mantém categorias.
- **Autor**: escreve os próprios posts e envia para revisão. Não publica.

Telas: Painel (visualizações, visitantes, posts mais lidos, de onde vêm os leitores, celular x computador),
Posts (busca, filtros por status e categoria, duplicar, excluir, liga/desliga da home direto na lista),
Escrever post, Mídia, Comentários, Categorias, Usuários e Meu perfil.

No editor, à direita:

- **Publicação**: data de publicação; uma data futura agenda o post, que entra no ar sozinho.
- **Onde exibir**:
  - *Home: seção Blog*: entra entre os 5 mais recentes da home.
  - *Home: Histórias da rede*: vira card de história; a 1ª tag vira a etiqueta.
  - *Destaque*: aparece primeiro e grande nas seções acima.
- **Capa, resumo, categoria, tags, endereço e Google** (com prévia de como aparece na busca).
- **Revisões**: as últimas 30 versões de cada post, com "Restaurar".

`Ctrl+S` salva. Fotos grandes são reduzidas para webp de até 1920px antes de subir. Comentários de visitantes
só aparecem depois de aprovados. Visitas da equipe logada não contam nos números.

## Colocar no ar (uma vez)

1. **Criar o projeto** em [supabase.com](https://supabase.com) (região São Paulo).
2. **Criar o banco**: no SQL Editor, cole e rode `supabase/migrations/20261104120000_blog.sql`
   (ou, com o CLI: `npx supabase link --project-ref SEU-PROJETO && npx supabase db push`).
3. **Publicar as funções** (convidar usuários e sitemap):
   ```bash
   npx supabase functions deploy admin-users
   npx supabase functions deploy sitemap --no-verify-jwt
   npx supabase secrets set SITE_URL=https://www.redeattini.com.br
   ```
4. **Login** (Authentication):
   - em *Sign In / Providers*, desligue **Allow new users to sign up** (só entra quem for convidado);
   - em *URL Configuration*, Site URL `https://www.redeattini.com.br/admin/` e, em Redirect URLs, o mesmo endereço;
   - em *Emails*, configure um SMTP próprio. O e-mail padrão do Supabase tem limite baixo de envios por hora.
5. **Primeiro administrador**: em Authentication > Users, use *Invite user* com o seu e-mail. Depois, no SQL Editor:
   ```sql
   update profiles set role = 'admin' where email = 'seu@email.com.br';
   ```
   Daqui em diante, os convites saem pelo próprio painel (Usuários).
6. **Variáveis do site** na hospedagem (ou em `.env.local`, veja `.env.example`):
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings > API). Gere o site de novo.
7. **Migrar o WordPress** (posts, capas, imagens do texto, categorias, comentários e SEO do Yoast):
   ```bash
   node scripts/migrate-wordpress.mjs --dry      # confere antes
   SUPABASE_URL=https://SEU-PROJETO.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-wordpress.mjs
   ```
   Pode rodar de novo enquanto o WordPress estiver no ar: traz só posts novos e não mexe no que já foi editado
   no painel (`--atualizar` força sobrescrever). A **service role key** é secreta: nunca vai para o site.
8. **Sitemap**: em `public/robots.txt`, troque `SEU-PROJETO` pelo id do projeto e envie o endereço no Google Search Console.
9. **Hospedagem**: `vercel.json` (Vercel) e `public/_redirects` (Netlify) já mandam `/blog/...` e os endereços
   antigos para o site. Em Apache/Nginx, aponte todas as rotas desconhecidas para `index.html`
   e `/admin/*` para `admin/index.html`.

## Rodar o blog na sua máquina

Precisa do Docker aberto.

```bash
npx supabase start          # sobe banco, login, imagens e e-mail de teste (portas 553xx)
npx supabase functions serve
```

Copie a URL e a `anon key` que o `start` mostrar para o `.env.local` (`VITE_SUPABASE_URL=http://127.0.0.1:55321`).
Os e-mails de convite e de nova senha caem em http://127.0.0.1:55324. `npx supabase stop` desliga tudo.

## Leads

Sem configuração, os formulários abrem o WhatsApp da Attini com a mensagem pronta.
Para gravar os leads em um sistema, defina no build `VITE_LEAD_ENDPOINT=https://seu-endpoint/leads`.
O formulário faz `POST` JSON nesse endereço e só cai no WhatsApp se o envio falhar.

## Onde editar

- `src/data.js`: números, lojas, cotas para a indústria, benefícios do lojista, marcas.
- `src/data.js` → `STORIES`: histórias de reserva, usadas só se o blog não responder.
- `src/geo.json`: estados e as 148 cidades (coordenadas reais).
- `supabase/migrations/`: banco do blog e permissões de cada papel.
- `scripts/migrate-wordpress.mjs`: regras de categoria da migração e quais posts viram Histórias da rede.
- `public/brands/`, `public/img/`, `public/flags/`: imagens do site.

## Limites conhecidos

- **Prévia ao compartilhar um post** (WhatsApp, LinkedIn): o site é estático, então a prévia mostra título e imagem
  gerais da Rede Attini, e não os do post. Dentro do site e no Google aparece certo. Para prévia por post é preciso
  uma função na hospedagem (Vercel ou Netlify) que preencha as tags do post. Dá para fazer quando a hospedagem estiver definida.
- Spam nos comentários: há campo-isca e limite por e-mail; se passar disso, entra um captcha.

## Antes de publicar

- Confirmar 220 lojas, R$ 780 mi (12 meses) e "80+ indústrias" em `src/data.js`.
- Confirmar a cidade do DF (entrou como Brasília em `src/geo.json`).
- Confirmar que a 4ª edição do Conexão Attini já aconteceu (o texto diz "já está na 4ª edição").
- Validar o escopo das cotas em `TRADE` com o comercial.
- Revisar as categorias que a migração criou (Eventos, Rede Attini, Gestão da loja, Mercado).
