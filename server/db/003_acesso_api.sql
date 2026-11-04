-- Acesso do back-end ao schema pela API do Supabase (chave secreta = papel service_role).
-- O público (chave publishable: anon/authenticated) continua SEM acesso nenhum a este schema.
-- Depois de rodar este arquivo: Supabase > Project Settings > Data API > "Exposed schemas" > adicione SYS_SITE_ATTINI.

grant usage on schema "SYS_SITE_ATTINI" to service_role;
grant all privileges on all tables in schema "SYS_SITE_ATTINI" to service_role;
grant all privileges on all sequences in schema "SYS_SITE_ATTINI" to service_role;
alter default privileges in schema "SYS_SITE_ATTINI" grant all on tables to service_role;
alter default privileges in schema "SYS_SITE_ATTINI" grant all on sequences to service_role;

-- Segunda trava: RLS ligado e sem nenhuma política. Quem não for service_role não lê nem grava nada,
-- mesmo que alguém dê permissão por engano no futuro. (service_role ignora RLS.)
alter table "SYS_SITE_ATTINI".users enable row level security;
alter table "SYS_SITE_ATTINI".auth_tokens enable row level security;
alter table "SYS_SITE_ATTINI".categories enable row level security;
alter table "SYS_SITE_ATTINI".posts enable row level security;
alter table "SYS_SITE_ATTINI".post_revisions enable row level security;
alter table "SYS_SITE_ATTINI".media enable row level security;
alter table "SYS_SITE_ATTINI".comments enable row level security;
alter table "SYS_SITE_ATTINI".post_views enable row level security;

-- Faz a API enxergar as permissões novas na hora.
notify pgrst, 'reload schema';
