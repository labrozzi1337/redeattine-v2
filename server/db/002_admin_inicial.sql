-- Senha provisória: quem tiver esta marca é obrigado a criar uma senha nova no primeiro acesso ao painel.
alter table "SYS_SITE_ATTINI".users add column if not exists must_change_password boolean not null default false;

-- Primeiro administrador. A senha provisória só serve para o primeiro login (o painel obriga a trocar).
insert into "SYS_SITE_ATTINI".users (email, name, role, password_hash, must_change_password)
values ('elvis@labrozzi.com.br', 'Elvis Labrozzi', 'admin', 'scrypt$Y4lwN79tOPxlX7/iSFVhnA==$q1RPUvB2hKLsUtqewzJTBY3WH0MoZz+wh6UdvZ9c5OZY5/iB6A4rCfwzcH0wJ6t4nIvhnqUff2W7kfwG0I9Nrg==', true)
on conflict (email) do nothing;
