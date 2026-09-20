-- Categoria vira cadastro proprio (nao mais texto livre em produtos).
-- Decisao de 19/09/2026: cliente quer criar/remover grupos de produto
-- livremente pelo sistema, nao so implicito via produto.

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

alter table categorias enable row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on categorias to anon, authenticated, service_role;

create policy "staff_acesso_total" on categorias for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- popula categorias com os nomes ja usados nos produtos de demonstracao
insert into categorias (nome, ordem)
select categoria, row_number() over (order by categoria)
from (select distinct categoria from produtos) c;

alter table produtos add column categoria_id uuid references categorias(id);

update produtos p
set categoria_id = c.id
from categorias c
where c.nome = p.categoria;

alter table produtos alter column categoria_id set not null;
alter table produtos drop column categoria;

-- sem "on delete cascade": apagar uma categoria com produto vinculado
-- (ativo ou nao) fica bloqueado pela FK - a aplicacao traduz isso num
-- popup explicando o motivo em vez de deixar estourar erro cru.
