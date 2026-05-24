-- ============================================================
-- CONTROLE FINANCEIRO PESSOAL — schema.sql
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

-- Habilitar extensão para UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELA: users
-- ============================================================
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text unique not null,
  password   text not null,   -- armazenado como hash bcrypt
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: transactions
-- ============================================================
create table if not exists transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  description text not null,
  amount      numeric(12,2) not null check (amount > 0),
  type        text not null check (type in ('income','expense')),
  category    text not null,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_date    on transactions(date);

-- ============================================================
-- TABELA: goals
-- ============================================================
create table if not exists goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  name           text not null,
  target_amount  numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0,
  deadline       date,
  created_at     timestamptz default now()
);

create index if not exists idx_goals_user_id on goals(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table users       enable row level security;
alter table transactions enable row level security;
alter table goals        enable row level security;

-- O backend usa service_role key (bypassa RLS), então as
-- políticas abaixo são uma camada extra de segurança caso
-- alguma chamada use a chave anon.

create policy "Usuário vê apenas si mesmo"
  on users for all
  using (id = auth.uid()::uuid);

create policy "Usuário vê apenas suas transações"
  on transactions for all
  using (user_id = auth.uid()::uuid);

create policy "Usuário vê apenas suas metas"
  on goals for all
  using (user_id = auth.uid()::uuid);
