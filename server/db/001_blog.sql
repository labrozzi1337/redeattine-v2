-- Blog da Rede Attini. O banco só guarda os dados: regras, permissões e cálculos ficam no back-end (Next.js).

create schema if not exists "SYS_SITE_ATTINI";

-- Pessoas que entram no painel. Papel: admin (tudo), editor (publica e modera), author (escreve e envia para revisão).
create table if not exists "SYS_SITE_ATTINI".users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  role text not null default 'author' check (role in ('admin', 'editor', 'author')),
  password_hash text,
  session_version int not null default 1,
  failed_logins int not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

-- Links de convite e de nova senha (guardamos só o hash do token).
create table if not exists "SYS_SITE_ATTINI".auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "SYS_SITE_ATTINI".users on delete cascade,
  kind text not null check (kind in ('invite', 'reset')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists "SYS_SITE_ATTINI".categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists "SYS_SITE_ATTINI".posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  excerpt text not null default '',
  content text not null default '',
  cover_url text,
  cover_alt text not null default '',
  status text not null default 'draft' check (status in ('draft', 'pending', 'published')),
  published_at timestamptz,
  author_id uuid references "SYS_SITE_ATTINI".users on delete set null,
  author_name text not null default '',
  category_id uuid references "SYS_SITE_ATTINI".categories on delete set null,
  tags text[] not null default '{}',
  show_home boolean not null default true,
  show_stories boolean not null default false,
  featured boolean not null default false,
  seo_title text not null default '',
  seo_description text not null default '',
  legacy_id int unique,
  legacy_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references "SYS_SITE_ATTINI".users on delete set null
);
create index if not exists posts_public_idx on "SYS_SITE_ATTINI".posts (status, published_at desc);

create table if not exists "SYS_SITE_ATTINI".post_revisions (
  id bigint generated always as identity primary key,
  post_id uuid not null references "SYS_SITE_ATTINI".posts on delete cascade,
  title text not null,
  excerpt text not null,
  content text not null,
  saved_at timestamptz not null,
  saved_by uuid references "SYS_SITE_ATTINI".users on delete set null
);
create index if not exists post_revisions_post_idx on "SYS_SITE_ATTINI".post_revisions (post_id, saved_at desc);

create table if not exists "SYS_SITE_ATTINI".media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  url text not null,
  alt text not null default '',
  width int,
  height int,
  size int,
  uploaded_by uuid references "SYS_SITE_ATTINI".users on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists "SYS_SITE_ATTINI".comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references "SYS_SITE_ATTINI".posts on delete cascade,
  parent_id uuid references "SYS_SITE_ATTINI".comments on delete cascade,
  author_name text not null,
  author_email text,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'spam')),
  user_id uuid references "SYS_SITE_ATTINI".users on delete set null,
  legacy_id int unique,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on "SYS_SITE_ATTINI".comments (post_id, created_at);

create table if not exists "SYS_SITE_ATTINI".post_views (
  id bigint generated always as identity primary key,
  post_id uuid not null references "SYS_SITE_ATTINI".posts on delete cascade,
  visitor text,
  referrer text,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists post_views_time_idx on "SYS_SITE_ATTINI".post_views (created_at);
create index if not exists post_views_post_idx on "SYS_SITE_ATTINI".post_views (post_id, created_at);

-- Num projeto Supabase, a API pública não enxerga este schema: só o back-end, pela conexão direta.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on schema "SYS_SITE_ATTINI" from anon, authenticated;
  end if;
end $$;
