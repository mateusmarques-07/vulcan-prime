-- Vulcan Prime - schema inicial (ver ESPECIFICACAO_TECNICA.md secao 22)

create extension if not exists "pgcrypto";

create table mesas (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  status text not null default 'livre'
    check (status in ('livre','ocupada','conta')),
  gorjeta_ativa boolean not null default false,
  gorjeta_pct numeric(5,2) not null default 10,
  created_at timestamptz not null default now()
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  preco numeric(10,2) not null check (preco >= 0),
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table comandas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id),
  status text not null default 'aberta'
    check (status in ('aberta','fechada')),
  aberta_em timestamptz not null default now(),
  fechada_em timestamptz
);

create table itens_comanda (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  nome_produto text not null,
  preco_unit numeric(10,2) not null,
  quantidade int not null check (quantidade > 0),
  observacao text,
  criado_em timestamptz not null default now()
);

create table fechamentos (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas(id),
  mesa_numero int not null,

  subtotal numeric(10,2) not null,

  gorjeta_pct numeric(5,2) not null default 0,
  gorjeta_valor numeric(10,2) not null default 0,
  gorjeta_forma_pagamento_id uuid references formas_pagamento(id),
  gorjeta_forma_pagamento_nome text,

  qtd_pessoas int,

  total numeric(10,2) not null,

  fechado_em timestamptz not null default now()
);

-- Suporta multiplas formas de pagamento por fechamento (so pro subtotal;
-- a gorjeta usa forma unica, guardada direto em fechamentos acima).
-- Decisao de 19/09/2026, ver ESPECIFICACAO_TECNICA.md secoes 13/14/22.
create table fechamento_pagamentos (
  id uuid primary key default gen_random_uuid(),
  fechamento_id uuid not null references fechamentos(id) on delete cascade,
  forma_pagamento_id uuid not null references formas_pagamento(id),
  forma_pagamento_nome text not null,
  valor numeric(10,2) not null check (valor > 0)
);
