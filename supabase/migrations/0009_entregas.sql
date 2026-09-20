-- Decisao de 20/09/2026 (rodada 3): Entregas por telefone viram um modulo
-- proprio, porque o campo unico "Entrega" do Salao so aguentava 1 pedido em
-- aberto por vez - e o restaurante normalmente manda varias entregas ao
-- mesmo tempo, cada uma esperando o motoboy voltar pra confirmar o
-- pagamento, de forma independente. O Salao volta a ter so Mesa e Balcao.

-- fechamentos precisa aceitar registro sem mesa/comanda (entrega nao tem
-- nenhum dos dois) e guardar o tipo explicitamente no proprio registro -
-- antes isso era so derivado da mesa atual (join por mesa_numero), o que
-- da errado se a mesa mudar de tipo depois (exatamente o que acontece
-- abaixo, com a mesa 12 deixando de ser Entrega).
alter table fechamentos alter column comanda_id drop not null;
alter table fechamentos alter column mesa_numero drop not null;
alter table fechamentos add column if not exists tipo text not null default 'mesa'
  check (tipo in ('mesa', 'balcao', 'entrega'));

-- Reorganiza o Salao pra "11 mesas numeradas + Balcao por ultimo" (12
-- campos): a mesa 11 (que era o Balcao) vira mesa de verdade, e a mesa 12
-- (que era a Entrega) vira o novo Balcao.
update mesas set tipo = 'mesa' where numero = 11;
update mesas set tipo = 'balcao' where numero = 12;

alter table mesas drop column taxa_entrega;
alter table mesas drop constraint mesas_tipo_check;
alter table mesas add constraint mesas_tipo_check check (tipo in ('mesa', 'balcao'));

-- Modulo de Entregas: numeracao propria que nunca reinicia (identity),
-- varias entregas em aberto ao mesmo tempo, forma de pagamento unica (sem
-- dividir - diferente da mesa), sem gorjeta nem divisao por pessoas (nao
-- se aplica a pedido por telefone).
create table entregas (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated always as identity unique,
  cliente_nome text not null,
  endereco text not null,
  taxa_entrega numeric(10,2) not null default 0,
  forma_pagamento_id uuid not null references formas_pagamento(id),
  forma_pagamento_nome text not null,
  observacao text,
  status text not null default 'aberta'
    check (status in ('aberta', 'em_rota', 'finalizada')),
  fechamento_id uuid references fechamentos(id),
  aberta_em timestamptz not null default now(),
  finalizada_em timestamptz
);

create table entrega_itens (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid not null references entregas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  nome_produto text not null,
  preco_unit numeric(10,2) not null,
  quantidade int not null check (quantidade > 0)
);

alter table entregas enable row level security;
alter table entrega_itens enable row level security;
grant all on entregas to anon, authenticated, service_role;
grant all on entrega_itens to anon, authenticated, service_role;
create policy "staff_acesso_total" on entregas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on entrega_itens for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Cria o cabecalho + os itens numa transacao so (mesmo racional do
-- abrir_mesa: uma falha no meio nao pode deixar registro pela metade).
create or replace function criar_entrega(
  p_cliente_nome text,
  p_endereco text,
  p_taxa_entrega numeric,
  p_forma_pagamento_id uuid,
  p_observacao text,
  p_itens jsonb -- [{produto_id, quantidade}, ...]
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entrega_id uuid;
  v_numero bigint;
  v_forma_nome text;
  v_item jsonb;
begin
  select nome into v_forma_nome from formas_pagamento where id = p_forma_pagamento_id;
  if v_forma_nome is null then
    raise exception 'Forma de pagamento não encontrada';
  end if;

  insert into entregas (cliente_nome, endereco, taxa_entrega, forma_pagamento_id, forma_pagamento_nome, observacao)
  values (p_cliente_nome, p_endereco, p_taxa_entrega, p_forma_pagamento_id, v_forma_nome, nullif(p_observacao, ''))
  returning id, numero into v_entrega_id, v_numero;

  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    insert into entrega_itens (entrega_id, produto_id, nome_produto, preco_unit, quantidade)
    select v_entrega_id, id, nome, preco, (v_item->>'quantidade')::int
    from produtos
    where id = (v_item->>'produto_id')::uuid;
  end loop;

  return v_numero;
end;
$$;

grant execute on function criar_entrega(text, text, numeric, uuid, text, jsonb) to authenticated;

-- Finaliza a entrega: congela um fechamento (pra entrar no caixa junto com
-- mesa/balcao, ja que o pagamento "entra no que foi" - decisao do
-- Mateus) + o pagamento na forma escolhida na criacao, numa transacao so.
create or replace function finalizar_entrega(p_entrega_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entrega record;
  v_subtotal numeric;
  v_total numeric;
  v_fechamento_id uuid;
begin
  select * into v_entrega from entregas where id = p_entrega_id for update;

  if v_entrega is null then
    raise exception 'Entrega não encontrada';
  end if;

  if v_entrega.status = 'finalizada' then
    return;
  end if;

  select coalesce(sum(preco_unit * quantidade), 0) into v_subtotal
  from entrega_itens where entrega_id = p_entrega_id;

  v_total := v_subtotal + v_entrega.taxa_entrega;

  insert into fechamentos (tipo, subtotal, taxa_entrega, total)
  values ('entrega', v_subtotal, v_entrega.taxa_entrega, v_total)
  returning id into v_fechamento_id;

  insert into fechamento_pagamentos (fechamento_id, forma_pagamento_id, forma_pagamento_nome, valor)
  values (v_fechamento_id, v_entrega.forma_pagamento_id, v_entrega.forma_pagamento_nome, v_total);

  update entregas
  set status = 'finalizada', finalizada_em = now(), fechamento_id = v_fechamento_id
  where id = p_entrega_id;
end;
$$;

grant execute on function finalizar_entrega(uuid) to authenticated;
