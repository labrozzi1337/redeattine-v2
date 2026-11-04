-- Blog da Rede Attini.
-- Papéis: admin (tudo, inclusive usuários), editor (publica e edita qualquer post),
-- author (escreve os próprios posts e envia para revisão; não publica).

-- ---------------------------------------------------------------- perfis
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text not null default '',
  role text not null default 'author' check (role in ('admin', 'editor', 'author')),
  created_at timestamptz not null default now()
);

create function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;
create function public.is_staff() returns boolean
language sql stable as $$ select public.my_role() is not null $$;
create function public.can_publish() returns boolean
language sql stable as $$ select coalesce(public.my_role() in ('admin', 'editor'), false) $$;

-- Todo usuário novo nasce Autor. O papel só muda pelo painel (admin) ou pela service role.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and public.my_role() <> 'admin' then
      raise exception 'Só administradores mudam papéis';
    end if;
    if old.role = 'admin' and (select count(*) from profiles where role = 'admin') = 1 then
      raise exception 'A rede precisa de pelo menos um administrador';
    end if;
  end if;
  new.email := old.email; -- e-mail vem do login, não do painel
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile();

alter table public.profiles enable row level security;
create policy "equipe vê a equipe" on public.profiles for select using (public.is_staff());
create policy "cada um edita o seu; admin edita todos" on public.profiles for update
  using (id = auth.uid() or public.my_role() = 'admin');

-- ---------------------------------------------------------------- categorias
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "todos leem categorias" on public.categories for select using (true);
create policy "editores mantêm categorias" on public.categories for all
  using (public.can_publish()) with check (public.can_publish());

-- ---------------------------------------------------------------- posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null default '',
  excerpt text not null default '',
  content text not null default '',
  cover_url text,
  cover_alt text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'published')),
  published_at timestamptz,                -- no futuro = agendado
  author_id uuid default auth.uid() references public.profiles on delete set null,
  author_name text not null default '',    -- assinatura exibida no site
  category_id uuid references public.categories on delete set null,
  tags text[] not null default '{}',
  -- Onde exibir
  show_home boolean not null default true,      -- home, seção Blog
  show_stories boolean not null default false,  -- home, Histórias da rede
  featured boolean not null default false,      -- aparece primeiro (e grande) na seção
  seo_title text not null default '',
  seo_description text not null default '',
  legacy_id int unique,   -- id no WordPress (migração)
  legacy_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index posts_public_idx on public.posts (status, published_at desc);

create table public.post_revisions (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts on delete cascade,
  title text not null,
  excerpt text not null,
  content text not null,
  saved_at timestamptz not null,
  saved_by uuid references public.profiles on delete set null
);
create index post_revisions_post_idx on public.post_revisions (post_id, saved_at desc);

-- Guarda a versão anterior a cada mudança de texto (últimas 30 por post) e carimba quem mexeu.
create function public.posts_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    new.updated_by := coalesce(auth.uid(), old.updated_by);
    if (new.title, new.excerpt, new.content) is distinct from (old.title, old.excerpt, old.content) then
      insert into post_revisions (post_id, title, excerpt, content, saved_at, saved_by)
      values (old.id, old.title, old.excerpt, old.content, old.updated_at, old.updated_by);
      delete from post_revisions where post_id = old.id and id not in (
        select id from post_revisions where post_id = old.id order by saved_at desc limit 30);
    end if;
  end if;
  return new;
end $$;
create trigger posts_write before insert or update on public.posts
  for each row execute function public.posts_before_write();

alter table public.posts enable row level security;
create policy "público lê publicados" on public.posts for select
  using (status = 'published' and published_at <= now());
create policy "equipe lê tudo" on public.posts for select using (public.is_staff());
create policy "equipe cria" on public.posts for insert
  with check (public.is_staff() and (public.can_publish() or (status <> 'published' and author_id = auth.uid())));
create policy "editor altera tudo; autor altera o próprio não publicado" on public.posts for update
  using (public.can_publish() or (author_id = auth.uid() and status <> 'published'))
  with check (public.can_publish() or (author_id = auth.uid() and status <> 'published'));
create policy "editor apaga tudo; autor apaga o próprio não publicado" on public.posts for delete
  using (public.can_publish() or (author_id = auth.uid() and status <> 'published'));

alter table public.post_revisions enable row level security;
create policy "equipe vê revisões" on public.post_revisions for select using (public.is_staff());

-- ---------------------------------------------------------------- mídia
create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  alt text not null default '',
  width int,
  height int,
  size int,
  uploaded_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;
create policy "equipe vê mídia" on public.media for select using (public.is_staff());
create policy "equipe envia mídia" on public.media for insert with check (public.is_staff());
create policy "equipe edita mídia" on public.media for update using (public.is_staff());
create policy "editor apaga; autor apaga o que enviou" on public.media for delete
  using (public.can_publish() or uploaded_by = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do nothing;
create policy "media: equipe envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());
create policy "media: equipe apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());
-- Substituir um arquivo (upsert) exige também ler e atualizar.
create policy "media: equipe lê" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_staff());
create policy "media: equipe substitui" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff());

-- ---------------------------------------------------------------- comentários
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  parent_id uuid references public.comments on delete cascade,
  author_name text not null check (length(author_name) between 2 and 80),
  author_email text,
  content text not null check (length(content) between 2 and 3000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'spam')),
  user_id uuid references public.profiles on delete set null,
  legacy_id int unique,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);
alter table public.comments enable row level security;
create policy "público lê aprovados" on public.comments for select using (status = 'approved' or public.is_staff());
create policy "equipe responde" on public.comments for insert with check (public.is_staff());
create policy "editores moderam" on public.comments for update using (public.can_publish());
create policy "editores apagam" on public.comments for delete using (public.can_publish());
-- O visitante não vê e-mails de ninguém.
revoke select on public.comments from anon;
grant select (id, post_id, parent_id, author_name, content, status, user_id, created_at) on public.comments to anon;

-- Visitante comenta por aqui: sempre entra como pendente.
create function public.add_comment(p_post uuid, p_parent uuid, p_name text, p_email text, p_content text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from posts where id = p_post and status = 'published' and published_at <= now()) then
    raise exception 'Post indisponível';
  end if;
  if p_email !~ '^\S+@\S+\.\S+$' then raise exception 'E-mail inválido'; end if;
  -- ponytail: limite simples por e-mail; trocar por captcha se o spam passar disso.
  if (select count(*) from comments where author_email = lower(p_email) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Muitos comentários seguidos. Tente mais tarde.';
  end if;
  insert into comments (post_id, parent_id, author_name, author_email, content)
  values (p_post, p_parent, trim(p_name), lower(trim(p_email)), trim(p_content));
end $$;

-- ---------------------------------------------------------------- números
create table public.post_views (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts on delete cascade,
  visitor text,
  referrer text,
  device text,
  created_at timestamptz not null default now()
);
create index post_views_time_idx on public.post_views (created_at);
create index post_views_post_idx on public.post_views (post_id, created_at);
alter table public.post_views enable row level security;
create policy "equipe vê números" on public.post_views for select using (public.is_staff());

create function public.track_view(p_post uuid, p_visitor text, p_referrer text, p_device text) returns void
language sql security definer set search_path = public as $$
  insert into post_views (post_id, visitor, referrer, device)
  select p_post, left(p_visitor, 64), left(nullif(p_referrer, ''), 120),
         case when p_device = 'mobile' then 'mobile' else 'desktop' end
  where exists (select 1 from posts where id = p_post and status = 'published' and published_at <= now())
$$;

-- Tudo o que o painel mostra, em uma chamada. Dias no fuso de Brasília.
create function public.blog_stats(p_days int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  since timestamptz := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo' - make_interval(days => p_days - 1);
  prev timestamptz := since - make_interval(days => p_days);
begin
  if not public.is_staff() then raise exception 'Sem acesso'; end if;
  return jsonb_build_object(
    'views', (select count(*) from post_views where created_at >= since),
    'visitors', (select count(distinct visitor) from post_views where created_at >= since),
    'prev_views', (select count(*) from post_views where created_at >= prev and created_at < since),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'views', coalesce(v.n, 0)) order by d.day), '[]')
      from generate_series((since at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') as d(day)
      left join (select (created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as n
                 from post_views where created_at >= since group by 1) v on v.day = d.day::date),
    'posts', (
      select coalesce(jsonb_agg(jsonb_build_object('id', post_id, 'views', n, 'visitors', u) order by n desc), '[]')
      from (select post_id, count(*) as n, count(distinct visitor) as u from post_views where created_at >= since group by 1) t),
    'referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('name', r, 'views', n) order by n desc), '[]')
      from (select coalesce(referrer, 'Acesso direto') as r, count(*) as n from post_views where created_at >= since group by 1 order by 2 desc limit 8) t),
    'devices', (
      select coalesce(jsonb_object_agg(device, n), '{}')
      from (select device, count(*) as n from post_views where created_at >= since group by 1) t)
  );
end $$;

