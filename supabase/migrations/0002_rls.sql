-- Vulcan Prime - RLS + grants (ver ESPECIFICACAO_TECNICA.md secao 24)

-- Grants explicitos: criar tabelas via conexao direta ao Postgres NAO aplica
-- os GRANTs de anon/authenticated/service_role que o dashboard do Supabase
-- normalmente configura sozinho. RLS abaixo ainda restringe o acesso real.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

alter table mesas enable row level security;
alter table produtos enable row level security;
alter table formas_pagamento enable row level security;
alter table comandas enable row level security;
alter table itens_comanda enable row level security;
alter table fechamentos enable row level security;
alter table fechamento_pagamentos enable row level security;

create policy "staff_acesso_total" on mesas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on produtos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on formas_pagamento for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on comandas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on itens_comanda for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on fechamentos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on fechamento_pagamentos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
